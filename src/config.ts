import { Computed, Dict, Schema, Session, Time } from 'koishi'
import { Size } from './utils'

const options: Computed.Options = {
  userFields: ['authority'],
}

export const modelMap = {
  safe: 'safe-diffusion',
  nai: 'nai-diffusion',
  furry: 'nai-diffusion-furry',
  'nai-v3': 'nai-diffusion-3',
  'nai-v4-curated-preview': 'nai-diffusion-4-curated-preview',
} as const

export const orientMap = {
  landscape: { height: 832, width: 1216 },
  portrait: { height: 1216, width: 832 },
  square: { height: 1024, width: 1024 },
} as const

export const hordeModels = require('../data/horde-models.json') as string[]

const ucPreset = [
  // Replace with the prompt words that come with novelai
  'nsfw, lowres, {bad}, error, fewer, extra, missing, worst quality',
  'jpeg artifacts, bad quality, watermark, unfinished, displeasing',
  'chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]',
].join(', ')

type Model = keyof typeof modelMap
type Orient = keyof typeof orientMap

export const models = Object.keys(modelMap) as Model[]
export const orients = Object.keys(orientMap) as Orient[]

export namespace scheduler {
  export const nai = ['native', 'karras', 'exponential', 'polyexponential'] as const
  export const nai4 = ['karras', 'exponential', 'polyexponential'] as const
  export const sd = ['Automatic', 'Uniform', 'Karras', 'Exponential', 'Polyexponential', 'SGM Uniform'] as const
  export const horde = ['karras'] as const
  export const comfyUI = ['normal', 'karras', 'exponential', 'sgm_uniform', 'simple', 'ddim_uniform'] as const
}

export namespace sampler {
  export const nai = {
    'k_euler_a': 'Euler ancestral',
    'k_euler': 'Euler',
    'k_lms': 'LMS',
    'ddim': 'DDIM',
    'plms': 'PLMS',
  }

  export const nai3 = {
    'k_euler': 'Euler',
    'k_euler_a': 'Euler ancestral',
    'k_dpmpp_2s_ancestral': 'DPM++ 2S ancestral',
    'k_dpmpp_2m': 'DPM++ 2M',
    'k_dpmpp_sde': 'DPM++ SDE',
    'ddim_v3': 'DDIM V3',
  }

  export const nai4 = {
    // recommended
    'k_euler': 'Euler',
    'k_euler_a': 'Euler ancestral',
    'k_dpmpp_2s_ancestral': 'DPM++ 2S ancestral',
    'k_dpmpp_2m_sde': 'DPM++ 2M SDE',
    // other
    'k_dpmpp_2m': 'DPM++ 2M',
    'k_dpmpp_sde': 'DPM++ SDE',
  }

  // samplers in stable-diffusion-webui
  // auto-generated by `build/fetch-sd-samplers.js`
  export const sd = require('../data/sd-samplers.json') as Dict<string>

  export const horde = {
    k_lms: 'LMS',
    k_heun: 'Heun',
    k_euler: 'Euler',
    k_euler_a: 'Euler a',
    k_dpm_2: 'DPM2',
    k_dpm_2_a: 'DPM2 a',
    k_dpm_fast: 'DPM fast',
    k_dpm_adaptive: 'DPM adaptive',
    k_dpmpp_2m: 'DPM++ 2M',
    k_dpmpp_2s_a: 'DPM++ 2S a',
    k_dpmpp_sde: 'DPM++ SDE',
    dpmsolver: 'DPM solver',
    lcm: 'LCM',
    DDIM: 'DDIM',
  }

  export const comfyui = {
    euler: 'Euler',
    euler_ancestral: 'Euler ancestral',
    heun: 'Heun',
    heunpp2: 'Heun++ 2',
    dpm_2: 'DPM 2',
    dpm_2_ancestral: 'DPM 2 ancestral',
    lms: 'LMS',
    dpm_fast: 'DPM fast',
    dpm_adaptive: 'DPM adaptive',
    dpmpp_2s_ancestral: 'DPM++ 2S ancestral',
    dpmpp_sde: 'DPM++ SDE',
    dpmpp_sde_gpu: 'DPM++ SDE GPU',
    dpmpp_2m: 'DPM++ 2M',
    dpmpp_2m_sde: 'DPM++ 2M SDE',
    dpmpp_2m_sde_gpu: 'DPM++ 2M SDE GPU',
    dpmpp_3m_sde: 'DPM++ 3M SDE',
    dpmpp_3m_sde_gpu: 'DPM++ 3M SDE GPU',
    ddpm: 'DDPM',
    lcm: 'LCM',
    ddim: 'DDIM',
    uni_pc: 'UniPC',
    uni_pc_bh2: 'UniPC BH2',
  }

  export function createSchema(map: Dict<string>) {
    return Schema.union(Object.entries(map).map(([key, value]) => {
      return Schema.const(key).description(value)
    })).loose().description('默认的采样器。').default('k_euler')
  }

  export function sd2nai(sampler: string, model: string): string {
    if (sampler === 'k_euler_a') return 'k_euler_ancestral'
    if (model === 'nai-v3' && sampler in nai3) return sampler
    else if (sampler in nai) return sampler
    return 'k_euler_ancestral'
  }
}

export const upscalers = [
  // built-in upscalers
  'None',
  'Lanczos',
  'Nearest',
  // third-party upscalers (might not be available)
  'LDSR',
  'ESRGAN_4x',
  'R-ESRGAN General 4xV3',
  'R-ESRGAN General WDN 4xV3',
  'R-ESRGAN AnimeVideo',
  'R-ESRGAN 4x+',
  'R-ESRGAN 4x+ Anime6B',
  'R-ESRGAN 2x+',
  'ScuNET GAN',
  'ScuNET PSNR',
  'SwinIR 4x',
] as const

export const latentUpscalers = [
  'Latent',
  'Latent (antialiased)',
  'Latent (bicubic)',
  'Latent (bicubic antialiased)',
  'Latent (nearest)',
  'Latent (nearest-exact)',
]

export interface Options {
  enhance: boolean
  model: string
  resolution: Size
  sampler: string
  seed: string
  steps: number
  scale: number
  noise: number
  strength: number
}

export interface PromptConfig {
  basePrompt?: Computed<string>
  negativePrompt?: Computed<string>
  forbidden?: Computed<string>
  defaultPromptSw?: boolean
  defaultPrompt?: Computed<string>
  placement?: Computed<'before' | 'after'>
  latinOnly?: Computed<boolean>
  translator?: boolean
  lowerCase?: boolean
  maxWords?: Computed<number>
}

export const PromptConfig: Schema<PromptConfig> = Schema.object({
  basePrompt: Schema.computed(Schema.string().role('textarea'), options).description('默认附加的标签。').default('best quality, amazing quality, very aesthetic, absurdres'),
  negativePrompt: Schema.computed(Schema.string().role('textarea'), options).description('默认附加的反向标签。').default(ucPreset),
  forbidden: Schema.computed(Schema.string().role('textarea'), options).description('违禁词列表。请求中的违禁词将会被自动删除。').default(''),
  defaultPromptSw: Schema.boolean().description('是否启用默认标签。').default(false),
  defaultPrompt: Schema.string().role('textarea', options).description('默认标签，可以在用户无输入prompt时调用。可选在sd-webui中安装dynamic prompt插件，配合使用以达到随机标签效果。').default(''),
  placement: Schema.computed(Schema.union([
    Schema.const('before').description('置于最前'),
    Schema.const('after').description('置于最后'),
  ]), options).description('默认附加标签的位置。').default('after'),
  translator: Schema.boolean().description('是否启用自动翻译。').default(true),
  latinOnly: Schema.computed(Schema.boolean(), options).description('是否只接受英文输入。').default(false),
  lowerCase: Schema.boolean().description('是否将输入的标签转换为小写。').default(true),
  maxWords: Schema.computed(Schema.natural(), options).description('允许的最大单词数量。').default(0),
}).description('输入设置')

const dtgModels = [
  'KBlueLeaf/DanTagGen-delta-rev2',
  'KBlueLeaf/DanTagGen-delta',
  'KBlueLeaf/DanTagGen-beta',
  'KBlueLeaf/DanTagGen-alpha',
  'KBlueLeaf/DanTagGen-gamma',
  'KBlueLeaf/DanTagGen-delta-rev2|ggml-model-Q6_K.gguf',
  'KBlueLeaf/DanTagGen-delta-rev2|ggml-model-Q8_0.gguf',
  'KBlueLeaf/DanTagGen-delta-rev2|ggml-model-f16.gguf',
  'KBlueLeaf/DanTagGen-delta|ggml-model-Q6_K.gguf',
  'KBlueLeaf/DanTagGen-delta|ggml-model-Q8_0.gguf',
  'KBlueLeaf/DanTagGen-delta|ggml-model-f16.gguf',
  'KBlueLeaf/DanTagGen-beta|ggml-model-Q6_K.gguf',
  'KBlueLeaf/DanTagGen-beta|ggml-model-Q8_0.gguf',
  'KBlueLeaf/DanTagGen-beta|ggml-model-f16.gguf',
  'KBlueLeaf/DanTagGen-alpha|ggml-model-Q6_K.gguf',
  'KBlueLeaf/DanTagGen-alpha|ggml-model-Q8_0.gguf',
  'KBlueLeaf/DanTagGen-alpha|ggml-model-f16.gguf',
  'KBlueLeaf/DanTagGen-gamma|ggml-model-Q6_K.gguf',
  'KBlueLeaf/DanTagGen-gamma|ggml-model-Q8_0.gguf',
  'KBlueLeaf/DanTagGen-gamma|ggml-model-f16.gguf',
] as const

const dtgTagLengths = ['very short', 'short', 'long', 'very long'] as const

export interface DanTagGenConfig {
  enabled: boolean
  disableAfterLen?: number
  totalTagLength?: 'very short' | 'short' | 'long' | 'very long'
  banTags?: string
  promptFormat?: string
  upsamplingTagsSeed?: number
  upsamplingTiming?: 'Before' | 'After'
  model?: string
  useCpu?: boolean
  noFormatting?: boolean
  temperature?: number
  topP?: number
  topK?: number
}

export const danTagGenConfig = Schema.object({
  enabled: Schema.const(true).required(),
  disableAfterLen: Schema.number().role('slider').min(0).max(200).description('在输入字数大于该值后不再启用tag生成。').default(100),
  totalTagLength: Schema.union(dtgTagLengths).description('生成的tag长度。').default('short'),
  banTags: Schema.string().role('textarea').description('禁止生成的tag，使用","分隔，支持Regex。').default(''),
  promptFormat: Schema.string().role('textarea').description('生成的格式。').default('<|special|>, <|characters|>,<|artist|>, <|general|>, <|meta|>, <|rating|>'),
  upsamplingTagsSeed: Schema.number().description('上采样种子。').default(-1),
  upsamplingTiming: Schema.union([
    Schema.const('Before').description('其他提示词处理前'),
    Schema.const('After').description('其他提示词处理后'),
  ]).description('上采样介入时机。').default('After'),
  model: Schema.union(dtgModels).description('生成模型。').default('KBlueLeaf/DanTagGen-delta-rev2'),
  useCpu: Schema.boolean().description('是否使用CPU（GGUF）。').default(false),
  noFormatting: Schema.boolean().description('是否禁用格式化。').default(false),
  temperature: Schema.number().role('slider').min(0.1).max(2.5).step(0.01).description('温度。').default(1),
  topP: Schema.number().role('slider').min(0).max(1).step(0.01).description('Top P。').default(0.8),
  topK: Schema.number().role('slider').min(0).max(200).description('Top K。').default(80),
}).description('sd-webui-dtg 配置') as Schema<DanTagGenConfig>

interface FeatureConfig {
  anlas?: Computed<boolean>
  text?: Computed<boolean>
  image?: Computed<boolean>
  upscale?: Computed<boolean>
}

const naiFeatures = Schema.object({
  anlas: Schema.computed(Schema.boolean(), options).default(true).description('是否允许使用点数。'),
})

const sdFeatures = Schema.object({
  upscale: Schema.computed(Schema.boolean(), options).default(true).description('是否启用图片放大。'),
})

const features = Schema.object({
  text: Schema.computed(Schema.boolean(), options).default(true).description('是否启用文本转图片。'),
  image: Schema.computed(Schema.boolean(), options).default(true).description('是否启用图片转图片。'),
})

interface ParamConfig {
  model?: Model
  sampler?: string
  smea?: boolean
  smeaDyn?: boolean
  scheduler?: string
  rescale?: Computed<number>
  decrisper?: boolean
  upscaler?: string
  restoreFaces?: boolean
  hiresFix?: boolean
  hiresFixUpscaler: string
  scale?: Computed<number>
  textSteps?: Computed<number>
  imageSteps?: Computed<number>
  maxSteps?: Computed<number>
  strength?: Computed<number>
  noise?: Computed<number>
  resolution?: Computed<Orient | Size>
  maxResolution?: Computed<number>
}

export interface Config extends PromptConfig, ParamConfig {
  type: 'token' | 'login' | 'naifu' | 'sd-webui' | 'stable-horde' | 'comfyui'
  token?: string
  email?: string
  password?: string
  authLv?: Computed<number>
  authLvDefault?: Computed<number>
  output?: Computed<'minimal' | 'default' | 'verbose'>
  features?: FeatureConfig
  apiEndpoint?: string
  endpoint?: string
  headers?: Dict<string>
  nsfw?: Computed<'disallow' | 'censor' | 'allow'>
  maxIterations?: number
  maxRetryCount?: number
  requestTimeout?: number
  recallTimeout?: number
  maxConcurrency?: number
  pollInterval?: number
  trustedWorkers?: boolean
  workflowText2Image?: string
  workflowImage2Image?: string
  danTagGen?: DanTagGenConfig,
}

export const Config = Schema.intersect([
  Schema.object({
    type: Schema.union([
      Schema.const('token').description('授权令牌'),
      ...process.env.KOISHI_ENV === 'browser' ? [] : [Schema.const('login').description('账号密码')],
      Schema.const('naifu').description('naifu'),
      Schema.const('sd-webui').description('sd-webui'),
      Schema.const('stable-horde').description('Stable Horde'),
      Schema.const('comfyui').description('ComfyUI'),
    ]).default('token').description('登录方式。'),
  }).description('登录设置'),

  Schema.union([
    Schema.intersect([
      Schema.union([
        Schema.object({
          type: Schema.const('token'),
          token: Schema.string().description('授权令牌。').role('secret').required(),
        }),
        Schema.object({
          type: Schema.const('login'),
          email: Schema.string().description('账号邮箱。').required(),
          password: Schema.string().description('账号密码。').role('secret').required(),
        }),
      ]),
      Schema.object({
        apiEndpoint: Schema.string().description('API 服务器地址。').default('https://api.novelai.net'),
        endpoint: Schema.string().description('图片生成服务器地址。').default('https://image.novelai.net'),
        headers: Schema.dict(String).role('table').description('要附加的额外请求头。').default({
          'referer': 'https://novelai.net/',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
        }),
      }),
    ]),
    Schema.object({
      type: Schema.const('naifu'),
      token: Schema.string().description('授权令牌。').role('secret'),
      endpoint: Schema.string().description('API 服务器地址。').required(),
      headers: Schema.dict(String).role('table').description('要附加的额外请求头。'),
    }),
    Schema.object({
      type: Schema.const('sd-webui'),
      endpoint: Schema.string().description('API 服务器地址。').required(),
      headers: Schema.dict(String).role('table').description('要附加的额外请求头。'),
    }),
    Schema.object({
      type: Schema.const('stable-horde'),
      endpoint: Schema.string().description('API 服务器地址。').default('https://stablehorde.net/'),
      token: Schema.string().description('授权令牌 (API Key)。').role('secret').default('0000000000'),
      nsfw: Schema.union([
        Schema.const('disallow').description('禁止'),
        Schema.const('censor').description('屏蔽'),
        Schema.const('allow').description('允许'),
      ]).description('是否允许 NSFW 内容。').default('allow'),
      trustedWorkers: Schema.boolean().description('是否只请求可信任工作节点。').default(false),
      pollInterval: Schema.number().role('time').description('轮询进度间隔时长。').default(Time.second),
    }),
    Schema.object({
      type: Schema.const('comfyui'),
      endpoint: Schema.string().description('API 服务器地址。').required(),
      headers: Schema.dict(String).role('table').description('要附加的额外请求头。'),
      pollInterval: Schema.number().role('time').description('轮询进度间隔时长。').default(Time.second),
    }),
  ]),

  Schema.object({
    authLv: Schema.computed(Schema.natural(), options).description('使用画图全部功能所需要的权限等级。').default(0),
    authLvDefault: Schema.computed(Schema.natural(), options).description('使用默认参数生成所需要的权限等级。').default(0),
  }).description('权限设置'),

  Schema.object({
    features: Schema.object({}),
  }).description('功能设置'),

  Schema.union([
    Schema.object({
      type: Schema.union(['token', 'login']).hidden(),
      features: Schema.intersect([naiFeatures, features]),
    }),
    Schema.object({
      type: Schema.const('sd-webui'),
      features: Schema.intersect([features, sdFeatures]),
    }),
    Schema.object({
      features: Schema.intersect([features]),
    }),
  ]),

  Schema.object({}).description('参数设置'),

  Schema.union([
    Schema.object({
      type: Schema.const('sd-webui').required(),
      sampler: sampler.createSchema(sampler.sd),
      upscaler: Schema.union(upscalers).description('默认的放大算法。').default('Lanczos'),
      restoreFaces: Schema.boolean().description('是否启用人脸修复。').default(false),
      hiresFix: Schema.boolean().description('是否启用高分辨率修复。').default(false),
      hiresFixUpscaler: Schema.union(latentUpscalers.concat(upscalers)).description('高分辨率修复的放大算法。').default('Latent'),
      scheduler: Schema.union(scheduler.sd).description('默认的调度器。').default('Automatic'),
    }),
    Schema.object({
      type: Schema.const('stable-horde').required(),
      sampler: sampler.createSchema(sampler.horde),
      model: Schema.union(hordeModels).loose().description('默认的生成模型。'),
      scheduler: Schema.union(scheduler.horde).description('默认的调度器。').default('karras'),
    }),
    Schema.object({
      type: Schema.const('naifu').required(),
      sampler: sampler.createSchema(sampler.nai),
    }),
    Schema.object({
      type: Schema.const('comfyui').required(),
      sampler: sampler.createSchema(sampler.comfyui).description('默认的采样器。').required(),
      model: Schema.string().description('默认的生成模型的文件名。').required(),
      workflowText2Image: Schema.path({
        filters: [{ name: '', extensions: ['.json'] }],
        allowCreate: true,
      }).description('API 格式的文本到图像工作流。'),
      workflowImage2Image: Schema.path({
        filters: [{ name: '', extensions: ['.json'] }],
        allowCreate: true,
      }).description('API 格式的图像到图像工作流。'),
      scheduler: Schema.union(scheduler.comfyUI).description('默认的调度器。').default('normal'),
    }),
    Schema.intersect([
      Schema.object({
        model: Schema.union(models).loose().description('默认的生成模型。').default('nai-v3'),
      }),
      Schema.union([
        Schema.object({
          model: Schema.const('nai-v3'),
          sampler: sampler.createSchema(sampler.nai3),
          smea: Schema.boolean().description('默认启用 SMEA。'),
          smeaDyn: Schema.boolean().description('默认启用 SMEA 采样器的 DYN 变体。'),
          scheduler: Schema.union(scheduler.nai).description('默认的调度器。').default('native'),
        }),
        Schema.object({
          model: Schema.const('nai-v4-curated-preview'),
          sampler: sampler.createSchema(sampler.nai4).default('k_euler_a'),
          scheduler: Schema.union(scheduler.nai4).description('默认的调度器。').default('karras'),
          rescale: Schema.computed(Schema.number(), options).min(0).max(1).description('输入服从度调整规模。').default(0),
        }),
        Schema.object({ sampler: sampler.createSchema(sampler.nai) }),
      ]),
      Schema.object({ decrisper: Schema.boolean().description('默认启用 decrisper') }),
    ]),
  ] as const),

  Schema.object({
    scale: Schema.computed(Schema.number(), options).description('默认对输入的服从度。').default(5),
    textSteps: Schema.computed(Schema.natural(), options).description('文本生图时默认的迭代步数。').default(28),
    imageSteps: Schema.computed(Schema.natural(), options).description('以图生图时默认的迭代步数。').default(50),
    maxSteps: Schema.computed(Schema.natural(), options).description('允许的最大迭代步数。').default(64),
    strength: Schema.computed(Schema.number(), options).min(0).max(1).description('默认的重绘强度。').default(0.7),
    noise: Schema.computed(Schema.number(), options).min(0).max(1).description('默认的重绘添加噪声强度。').default(0.2),
    resolution: Schema.computed(Schema.union([
      Schema.const('portrait').description('肖像 (832x2326)'),
      Schema.const('landscape').description('风景 (1216x832)'),
      Schema.const('square').description('方形 (1024x1024)'),
      Schema.object({
        width: Schema.natural().description('图片宽度。').default(1024),
        height: Schema.natural().description('图片高度。').default(1024),
      }).description('自定义'),
    ]), options).description('默认生成的图片尺寸。').default('portrait'),
    maxResolution: Schema.computed(Schema.natural(), options).description('允许生成的宽高最大值。').default(1920),
  }),

  PromptConfig,

  Schema.object({
    output: Schema.union([
      Schema.const('minimal').description('只发送图片'),
      Schema.const('default').description('发送图片和关键信息'),
      Schema.const('verbose').description('发送全部信息'),
    ]).description('输出方式。').default('default'),
    maxIterations: Schema.natural().description('允许的最大绘制次数。').default(1),
    maxRetryCount: Schema.natural().description('连接失败时最大的重试次数。').default(3),
    requestTimeout: Schema.number().role('time').description('当请求超过这个时间时会中止并提示超时。').default(Time.minute),
    recallTimeout: Schema.number().role('time').description('图片发送后自动撤回的时间 (设置为 0 以禁用此功能)。').default(0),
    maxConcurrency: Schema.number().description('单个频道下的最大并发数量 (设置为 0 以禁用此功能)。').default(0),
  }).description('高级设置'),


  Schema.union([
    Schema.object({
      type: Schema.const('sd-webui'),
      danTagGen: danTagGenConfig,
    })
  ]),
  Schema.union([
    Schema.object({
      type: Schema.const('sd-webui'),
      danTagGen: Schema.object({
        enabled: Schema.boolean().description('是否启用 sd-webui-dtg 插件。').default(false),
      }).description('sd-webui 插件设置'),
    }),
  ]),
]) as Schema<Config>

interface Forbidden {
  pattern: string
  strict: boolean
}

export function parseForbidden(input: string) {
  return input.trim()
    .toLowerCase()
    .replace(/，/g, ',')
    .replace(/！/g, '!')
    .split(/(?:,\s*|\s*\n\s*)/g)
    .filter(Boolean)
    .map<Forbidden>((pattern: string) => {
      const strict = pattern.endsWith('!')
      if (strict) pattern = pattern.slice(0, -1)
      pattern = pattern.replace(/[^a-z0-9\u00ff-\uffff:]+/g, ' ').trim()
      return { pattern, strict }
    })
}

const backslash = /@@__BACKSLASH__@@/g

export function parseInput(session: Session, input: string, config: Config, override: boolean): string[] {
  if (!input) {
    return [
      null,
      [session.resolve(config.basePrompt), session.resolve(config.defaultPrompt)].join(','),
      session.resolve(config.negativePrompt)
    ]
  }

  input = input
    .replace(/\\\\/g, backslash.source)
    .replace(/，/g, ',')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/《/g, '<')
    .replace(/》/g, '>')

  if (config.type === 'sd-webui') {
    input = input
      .split('\\{').map(s => s.replace(/\{/g, '(')).join('\\{')
      .split('\\}').map(s => s.replace(/\}/g, ')')).join('\\}')
  } else {
    input = input
      .split('\\(').map(s => s.replace(/\(/g, '{')).join('\\(')
      .split('\\)').map(s => s.replace(/\)/g, '}')).join('\\)')
  }

  input = input
    .replace(backslash, '\\')
    .replace(/_/g, ' ')

  if (session.resolve(config.latinOnly) && /[^\s\w"'“”‘’.,:|\\()\[\]{}<>-]/.test(input)) {
    return ['.latin-only']
  }

  const negative = []
  const placement = session.resolve(config.placement)
  const appendToList = (words: string[], input = '') => {
    const tags = input.split(/,\s*/g)
    if (placement === 'before') tags.reverse()
    for (let tag of tags) {
      tag = tag.trim()
      if (config.lowerCase) tag = tag.toLowerCase()
      if (!tag || words.includes(tag)) continue
      if (placement === 'before') {
        words.unshift(tag)
      } else {
        words.push(tag)
      }
    }
  }

  // extract negative prompts
  const capture = input.match(/(,\s*|\s+)(-u\s+|--undesired\s+|negative prompts?:\s*)([\s\S]+)/m)
  if (capture?.[3]) {
    input = input.slice(0, capture.index).trim()
    appendToList(negative, capture[3])
  }

  // remove forbidden words
  const forbidden = parseForbidden(session.resolve(config.forbidden))
  const positive = input.split(/,\s*/g).filter((word) => {
    // eslint-disable-next-line no-control-regex
    word = word.toLowerCase().replace(/[\x00-\x7f]/g, s => s.replace(/[^0-9a-zA-Z]/, ' ')).replace(/\s+/, ' ').trim()
    if (!word) return false
    for (const { pattern, strict } of forbidden) {
      if (strict && word.split(/\W+/g).includes(pattern)) {
        return false
      } else if (!strict && word.includes(pattern)) {
        return false
      }
    }
    return true
  }).map((word) => {
    if (/^<.+>$/.test(word)) return word.replace(/ /g, '_')
    return word.toLowerCase()
  })

  if (Math.max(getWordCount(positive), getWordCount(negative)) > (session.resolve(config.maxWords) || Infinity)) {
    return ['.too-many-words']
  }

  const sanitizedInput = positive.join(',')
  if (!override) {
    appendToList(positive, session.resolve(config.basePrompt))
    appendToList(negative, session.resolve(config.negativePrompt))
    if (config.defaultPromptSw) appendToList(positive, session.resolve(config.defaultPrompt))
  }

  return [null, positive.join(', '), negative.join(', '), sanitizedInput]
}

function getWordCount(words: string[]) {
  return words.join(' ').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').length
}
