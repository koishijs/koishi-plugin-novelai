import { Context, Dict, Logger, omit, Quester, segment, Session, trimSlash } from 'koishi'
import { Config, modelMap, models, orientMap, parseForbidden, parseInput, sampler, sdUpscalers } from './config'
import { ImageData, StableDiffusionWebUI } from './types'
import { closestMultiple, download, getImageSize, login, NetworkError, project, resizeInput, Size, stripDataPrefix } from './utils'
import {} from '@koishijs/translator'
import {} from '@koishijs/plugin-help'

export * from './config'

export const reactive = true
export const name = 'novelai'

const logger = new Logger('novelai')

function handleError(session: Session, err: Error) {
  if (Quester.isAxiosError(err)) {
    if (err.response?.status === 402) {
      return session.text('.unauthorized')
    } else if (err.response?.status) {
      return session.text('.response-error', [err.response.status])
    } else if (err.code === 'ETIMEDOUT') {
      return session.text('.request-timeout')
    } else if (err.code) {
      return session.text('.request-failed', [err.code])
    }
  }
  logger.error(err)
  return session.text('.unknown-error')
}

interface Forbidden {
  pattern: string
  strict: boolean
}

export function apply(ctx: Context, config: Config) {
  ctx.i18n.define('zh', require('./locales/zh-CN'))
  ctx.i18n.define('zh-TW', require('./locales/zh-TW'))
  ctx.i18n.define('en', require('./locales/en-US'))
  ctx.i18n.define('fr', require('./locales/fr-FR'))
  ctx.i18n.define('ja', require('./locales/ja-JP'))

  let forbidden: Forbidden[]
  const tasks: Dict<Set<string>> = Object.create(null)
  const globalTasks = new Set<string>()

  ctx.accept(['forbidden'], (config) => {
    forbidden = parseForbidden(config.forbidden)
  }, { immediate: true })

  let tokenTask: Promise<string> = null
  const getToken = () => tokenTask ||= login(ctx)
  ctx.accept(['token', 'type', 'email', 'password'], () => tokenTask = null)

  const thirdParty = () => !['login', 'token'].includes(config.type)

  const restricted = (session: Session<'authority'>) => {
    if (thirdParty()) return false
    if (typeof config.allowAnlas === 'boolean') {
      return !config.allowAnlas
    } else {
      return session.user.authority < config.allowAnlas
    }
  }

  const step = (source: string) => {
    const value = +source
    if (value * 0 === 0 && Math.floor(value) === value && value > 0 && value <= (config.maxSteps || Infinity)) return value
    throw new Error()
  }

  const resolution = (source: string, session: Session<'authority'>): Size => {
    if (source in orientMap) return orientMap[source]
    if (restricted(session)) throw new Error()
    const cap = source.match(/^(\d+)[x×](\d+)$/)
    if (!cap) throw new Error()
    const width = closestMultiple(+cap[1])
    const height = closestMultiple(+cap[2])
    if (Math.max(width, height) > (config.maxResolution || Infinity)) {
      throw new Error()
    }
    return { width, height }
  }

  const cmd = ctx.command('novelai <prompts:text>')
    .alias('nai')
    .userFields(['authority'])
    .shortcut('画画', { fuzzy: true })
    .shortcut('畫畫', { fuzzy: true })
    .shortcut('约稿', { fuzzy: true })
    .shortcut('約稿', { fuzzy: true })
    .shortcut('增强', { fuzzy: true, options: { enhance: true } })
    .shortcut('增強', { fuzzy: true, options: { enhance: true } })
    .option('enhance', '-e', { hidden: restricted })
    .option('model', '-m <model>', { type: models, hidden: thirdParty })
    .option('resolution', '-r <resolution>', { type: resolution })
    .option('override', '-O')
    .option('sampler', '-s <sampler>')
    .option('seed', '-x <seed:number>')
    .option('steps', '-t <step>', { type: step, hidden: restricted })
    .option('scale', '-c <scale:number>')
    .option('noise', '-n <noise:number>', { hidden: restricted })
    .option('strength', '-N <strength:number>', { hidden: restricted })
    .option('undesired', '-u <undesired>')
    .option('noTranslator', '-T', { hidden: () => !ctx.translator || !config.translator })
    .action(async ({ session, options }, input) => {
      if (!input?.trim()) return session.execute('help novelai')

      let imgUrl: string, image: ImageData
      if (!restricted(session)) {
        input = segment.transform(input, {
          image(attrs) {
            imgUrl = attrs.url
            return ''
          },
        })

        if (options.enhance && !imgUrl) {
          return session.text('.expect-image')
        }

        if (!input.trim() && !config.basePrompt) {
          return session.text('.expect-prompt')
        }
      } else {
        delete options.enhance
        delete options.steps
      }

      if (config.translator && ctx.translator && !options.noTranslator) {
        try {
          input = await ctx.translator.translate({ input, target: 'en' })
        } catch (err) {
          logger.warn(err)
        }
      }

      const [errPath, prompt, uc] = parseInput(input, config, forbidden, options.override)
      if (errPath) return session.text(errPath)

      let token: string
      try {
        token = await getToken()
      } catch (err) {
        if (err instanceof NetworkError) {
          return session.text(err.message, err.params)
        }
        logger.error(err)
        return session.text('.unknown-error')
      }

      const model = modelMap[options.model]
      const seed = options.seed || Math.floor(Math.random() * Math.pow(2, 32))

      const parameters: Dict = {
        seed,
        prompt,
        n_samples: 1,
        uc,
        // 0: low quality + bad anatomy
        // 1: low quality
        // 2: none
        ucPreset: 2,
        qualityToggle: false,
      }

      if (imgUrl) {
        try {
          image = await download(ctx, imgUrl)
        } catch (err) {
          if (err instanceof NetworkError) {
            return session.text(err.message, err.params)
          }
          logger.error(err)
          return session.text('.download-error')
        }

        Object.assign(parameters, {
          scale: options.scale ?? 11,
          steps: options.steps ?? 50,
        })
        if (options.enhance) {
          const size = getImageSize(image.buffer)
          if (size.width + size.height !== 1280) {
            return session.text('.invalid-size')
          }
          Object.assign(parameters, {
            height: size.height * 1.5,
            width: size.width * 1.5,
            noise: options.noise ?? 0,
            strength: options.strength ?? 0.2,
          })
        } else {
          options.resolution ||= resizeInput(getImageSize(image.buffer))
          Object.assign(parameters, {
            height: options.resolution.height,
            width: options.resolution.width,
            noise: options.noise ?? 0.2,
            strength: options.strength ?? 0.7,
          })
        }
      } else {
        options.resolution ||= orientMap[config.orient]
        Object.assign(parameters, {
          height: options.resolution.height,
          width: options.resolution.width,
          scale: options.scale ?? 11,
          steps: options.steps ?? 28,
        })
      }

      const id = Math.random().toString(36).slice(2)
      if (config.maxConcurrency) {
        const store = tasks[session.cid] ||= new Set()
        if (store.size >= config.maxConcurrency) {
          return session.text('.concurrent-jobs')
        } else {
          store.add(id)
        }
      }

      session.send(globalTasks.size
        ? session.text('.pending', [globalTasks.size])
        : session.text('.waiting'))

      globalTasks.add(id)
      const cleanUp = () => {
        tasks[session.cid]?.delete(id)
        globalTasks.delete(id)
      }

      const path = (() => {
        switch (config.type) {
          case 'sd-webui':
            return image ? '/sdapi/v1/img2img' : '/sdapi/v1/txt2img'
          case 'naifu':
            return '/generate-stream'
          default:
            return '/ai/generate-image'
        }
      })()

      const data = (() => {
        if (config.type !== 'sd-webui') {
          parameters.sampler = sampler.sd2nai(options.sampler)
          parameters.image = image?.base64 // NovelAI / NAIFU accepts bare base64 encoded image
          if (config.type === 'naifu') return parameters
          return { model, input: prompt, parameters: omit(parameters, ['prompt']) }
        }

        return {
          sampler_index: sampler.sd[options.sampler],
          init_images: image && [image.dataUrl], // sd-webui accepts data URLs with base64 encoded image
          ...project(parameters, {
            prompt: 'prompt',
            batch_size: 'n_samples',
            seed: 'seed',
            negative_prompt: 'uc',
            cfg_scale: 'scale',
            steps: 'steps',
            width: 'width',
            height: 'height',
            denoising_strength: 'strength',
          }),
        }
      })()

      const request = () => ctx.http.axios(trimSlash(config.endpoint) + path, {
        method: 'POST',
        timeout: config.requestTimeout,
        headers: {
          ...config.headers,
          authorization: 'Bearer ' + token,
        },
        data,
      }).then((res) => {
        if (config.type === 'sd-webui') {
          return stripDataPrefix((res.data as StableDiffusionWebUI.Response).images[0])
        }
        // event: newImage
        // id: 1
        // data:
        return res.data?.slice(27)
      })

      let base64: string, count = 0
      while (true) {
        try {
          base64 = await request()
          cleanUp()
          break
        } catch (err) {
          if (Quester.isAxiosError(err)) {
            if (err.code && err.code !== 'ETIMEDOUT' && ++count < config.maxRetryCount) {
              continue
            }
          }
          cleanUp()
          return handleError(session, err)
        }
      }

      if (!base64.trim()) return session.text('.empty-response')

      function getContent() {
        if (config.output === 'minimal') return segment.image('base64://' + base64)
        const attrs = {
          userId: session.userId,
          nickname: session.author?.nickname || session.username,
        }
        const result = segment('figure')
        const lines = [`seed = ${seed}`]
        if (config.output === 'verbose') {
          if (!thirdParty()) {
            lines.push(`model = ${model}`)
          }
          lines.push(
            `sampler = ${options.sampler}`,
            `steps = ${parameters.steps}`,
            `scale = ${parameters.scale}`,
          )
          if (parameters.image) {
            lines.push(
              `strength = ${parameters.strength}`,
              `noise = ${parameters.noise}`,
            )
          }
        }
        result.children.push(segment('message', attrs, lines.join('\n')))
        result.children.push(segment('message', attrs, `prompt = ${prompt}`))
        if (config.output === 'verbose') {
          result.children.push(segment('message', attrs, `undesired = ${uc}`))
        }
        result.children.push(segment('message', attrs, segment.image('base64://' + base64)))
        return result
      }

      const ids = await session.send(getContent())

      if (config.recallTimeout) {
        ctx.setTimeout(() => {
          for (const id of ids) {
            session.bot.deleteMessage(session.channelId, id)
          }
        }, config.recallTimeout)
      }
    })

  ctx.accept(['model', 'orient', 'sampler'], (config) => {
    cmd._options.model.fallback = config.model
    cmd._options.sampler.fallback = config.sampler
    cmd._options.sampler.type = Object.keys(config.type === 'sd-webui' ? sampler.sd : sampler.nai)
  }, { immediate: true })

  if (config.type === 'sd-webui' && config.enableUpscale) {
    const subcmd = cmd
      .subcommand('.upscale')
      .shortcut('放大', { fuzzy: true })
      .option('scale', '-s <scale:number>', { fallback: 2 })
      .option('resolution', '-r <resolution>', { type: resolution })
      .option('upscaler', '-u <upscaler>')
      .option('upscaler2', '-p <upscaler2>')
      .option('upscaler2visibility', '-v <upscaler2visibility:number>')
      .option('upscaleFirst', '-f', { type: 'boolean', fallback: false })
      .action(async ({ session, options }, input) => {
        let imgUrl: string
        segment.transform(input, {
          image(attrs) {
            imgUrl = attrs.url
            return ''
          },
        })

        if (!imgUrl) return session.text('.expect-image')
        let image: ImageData
        try {
          image = await download(ctx, imgUrl)
        } catch (err) {
          if (err instanceof NetworkError) {
            return session.text(err.message, err.params)
          }
          logger.error(err)
          return session.text('.download-error')
        }

        if (!sdUpscalers.includes(options.upscaler) || (options.upscaler2 && !sdUpscalers.includes(options.upscaler2))) {
          return session.text('.invalid-upscaler')
        }

        const data: StableDiffusionWebUI.ExtraSingleImageRequest = {
          image: image.dataUrl,
          resize_mode: !!options.resolution ? 1 : 0,
          show_extras_results: true,
          upscaling_resize: options.scale,
          upscaling_resize_h: options.resolution?.height,
          upscaling_resize_w: options.resolution?.width,
          upscaler_1: options.upscaler,
          upscaler_2: options.upscaler2 ?? 'None',
          extras_upscaler_2_visibility: options.upscaler2visibility ?? 1,
          upscale_first: options.upscaleFirst,
        }

        try {
          const resp = await ctx.http.axios(trimSlash(config.endpoint) + '/sdapi/v1/extra-single-image', {
            method: 'POST',
            timeout: config.requestTimeout,
            headers: {
              ...config.headers,
            },
            data,
          })
          const base64 = stripDataPrefix((resp.data as StableDiffusionWebUI.ExtraSingleImageResponse).image)
          return segment.image('base64://' + base64)
        } catch (e) { console.log (e) }
      })

    ctx.accept(['upscaler'], (config) => {
      subcmd._options.upscaler.fallback = config.upscaler
      subcmd._options.upscaler.type = sdUpscalers
    }, { immediate: true })
  }
}
