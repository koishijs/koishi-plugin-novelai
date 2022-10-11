# koishi-plugin-novelai

[![downloads](https://img.shields.io/npm/dm/koishi-plugin-novelai?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-novelai)
[![npm](https://img.shields.io/npm/v/koishi-plugin-novelai?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-novelai)

基于 [NovelAI](https://novelai.net/) 的画图插件。已实现功能：

- 绘制图片
- 更改模型、采样器、图片尺寸
- 高级请求语法
- 自定义违禁词表
- 发送一段时间后自动撤回
- 连接到自建私服
- img2img · 图片增强

得益于 Koishi 的插件化机制，只需在插件市场中添加插件即可轻松添加更多功能：

- 多平台支持 (QQ、Discord、Telegram、开黑啦等)
- 使用rate-limit插件进行指令调用限制 (限制每个用户每天可以调用的次数和每次调用的间隔)
- 使用switch插件进行上下文管理 (限制在哪些群聊中哪些用户可以访问)
- 使用locals插件进行多语言支持 (修改为使用不同语言的用户提供对应的回复)
- 以及更多！快来插件市场看看吧！

**所以快去给 [Koishi](https://github.com/koishijs/koishi) 点个 star 吧！**

## 效果展示

以下图片均使用本插件在聊天平台生成：

| ![example](https://novelai-gallery.vercel.app/69ff89485ee83344868446d9c2b445590cea859d.png) | ![example](https://novelai-gallery.vercel.app/91a9b0a1c3abad3a515efaa4befe27a64aa7c4b8.png) | ![example](https://novelai-gallery.vercel.app/d0e3dbcbdfba07e435c7c84b4de47cd99c4918c0.png) | ![example](https://novelai-gallery.vercel.app/40e5341a66c0fb97e51ef3d23e51c8150a0f3613.png) |
|:-:|:-:|:-:|:-:|
| ![example](https://novelai-gallery.vercel.app/2e631c1944b9579b2c004481c9edff9ac1784330.png) |

## 快速搭建

给没有使用过 Koishi 的新人提供一份简单的快速搭建指南：

> **Warning** \
> 在此之前，你需要一个**拥有有效付费计划的 NovelAI 账号**，本插件只使用 NovelAI 提供的接口。 \
> 付费计划请自行前往 [NovelAI](https://novelai.net/) 了解。

1. 前往[这里](https://github.com/koishijs/koishi-desktop/releases)下载 Koishi 桌面版
2. 启动桌面版，你将会看到一个控制台界面
3. 点击左侧的「插件市场」，搜索「novelai」并点击「安装」
4. 点击左侧的「插件配置」，选择「novelai」插件，填写你的[授权令牌](#token)，并点击右上角的「启用」按钮
5. 现在你已经可以在「沙盒」中使用画图功能了！

如果想进一步在 QQ 中使用，可继续进行下列操作：

1. 准备一个 QQ 号 (等级不要过低，否则可能被风控)
2. 点击左侧的「插件配置」，选择「onebot」插件，完成以下配置：
    - 在「selfId」填写你的 QQ 号
    - 在「password」填写你的密码
    - 在「protocol」选择 `ws-reverse`
    - 开启「gocqhttp.enable」选项
3. 点击右上角的「启用」按钮
4. 现在你可以在 QQ 上中使用画图功能了！

## 基本用法

### 从文本生成图片（text2img）

输入「约稿 / 画画」+ 关键词进行图片绘制。关键词需要为英文，多个关键词之间用逗号分隔。例如：

```
约稿 koishi
```

### 从图片生成图片（img2img）

> **Note** \
> 需要在设置中开启 [allowAnlas](#allowAnlas) 选项才能够使用

输入「约稿 / 画画」+ 关键词 + 图片 进行图片绘制。例如：

```
约稿 koishi 一张图片
```

### 增强（enhance）

输入「增强」+ 关键词 + 图片 进行图片绘制。例如：

> **Note** \
> 需要在设置中开启 [allowAnlas](#allowAnlas) 选项才能够使用

```
增强 koishi 一张图片
```

## 高级功能

### 切换生成模型 (model)

可以用 `-m` 或 `--model` 切换生成模型，可选值包括：

- `safe`：较安全的图片
- `nai`：自由度较高的图片 (默认)
- `furry`：福瑞控特攻 (beta)

```
约稿 -m furry koishi
```

### 更改图片方向 (orient)

可以用 `-o` 或 `--orient` 更改图片方向，可选值包括：

- `portrait`：768×512 (默认)
- `square`：640×640
- `landscape`：512×768

```
约稿 -o landscape koishi
```

### 设置采样器 (sampler)

可以用 `-s` 或 `--sampler` 设置采样器，可选值包括：

- `k_euler_ancestral` (默认)
- `k_euler`
- `k_lms`
- `plms`
- `ddim`

即使使用了相同的输入，不同的采样器也会输出不同的内容。目前一般推荐使用 `k_euler_ancestral`，因为其能够提供相对稳定的高质量图片生成 (欢迎在 issue 中讨论各种采样器的区别)。

### 调整影响因子

使用半角方括号 `[]` 包裹关键词以减弱该关键词的权重，使用半角花括号 `{}` 包裹关键词以增强该关键词的权重。例如：

```
约稿 [tears], {spread legs}
```

每一层括号会增强 / 减弱 1.05 倍的权重。也可以通过多次使用括号来进一步增强或减弱关键词的权重。例如：

```
约稿 [[tears]], {{{smile}}}
```

### 要素混合

使用 `|` 分隔多个关键词以混合多个要素。例如：

```
约稿 cat | frog
```

你将得到一只缝合怪 (字面意义上)。

可以进一步在关键词后添加 `:x` 来指定单个关键词的权重，`x` 的取值范围是 `0.1~100`，默认为 1。例如：

```
约稿 cat :2 | dog
```

这时会得到一个更像猫的猫狗。

### 随机种子 (seed)

AI 会使用种子来生成噪音然后进一步生成你需要的图片，每次随机生成时都会有一个唯一的种子。使用 `-x` 或 `--seed` 并传入相同的种子可以让 AI 尝试使用相同的路数来生成图片。

```
约稿 -x 1234567890 koishi
```

> **Warning** \
> 注意：在同一模型和后端实现中，保持所有参数一致的情况下，相同的种子会产生同样的图片。
> 取决于其他参数，后端实现和模型，相同的种子不一定生成相同的图片，但一般会带来更多的相似之处。

### 迭代步数 (steps)

更多的迭代步数**可能**会有更好的生成效果，但是一定会导致生成时间变长。太多的steps也可能适得其反，几乎不会有提高。

一种做法是先使用较少的步数来进行快速生成来检查构图，直到找到喜欢的，然后再使用更多步数来生成最终图像。

默认情况下的迭代步数为 28 (传入图片时为 50)，28 也是不会收费的最高步数。可以使用 `-t` 或 `--steps` 手动控制迭代步数。

```
约稿 -t 50 koishi
```

### 对输入的服从度 (scale)

服从度较低时 AI 有较大的自由发挥空间，服从度较高时 AI 则更倾向于遵守你的输入。但如果太高的话可能会产生反效果 (比如让画面变得难看)。更高的值也需要更多计算。

有时，越低的 scale 会让画面有更柔和，更有笔触感，反之会越高则会增加画面的细节和锐度。

| 服从度 | 行为 |
| :---: | --- |
| 2~8   | 会自由地创作，AI 有它自己的想法 |
| 9~13  | 会有轻微变动，大体上是对的 |
| 14~18 | 基本遵守输入，偶有变动 |
| 19+   | 非常专注于输入 |

默认情况下的服从度为 12 (传入图片时为 11)。可以使用 `-c` 或 `--scale` 手动控制服从度。

```
约稿 -c 10 koishi
```

## 配置项

### token

- 类型：`string`

授权令牌 (必填)。获取方式如下：

1. 在网页中登录你的 NovelAI 账号
2. 打开控制台 (F12)，并切换到控制台 (Console) 标签页
3. 输入下面的代码并按下回车运行

```js
console.log(JSON.parse(localStorage.session).auth_token)
```

4. 输出的字符串就是你的授权令牌

### model

- 类型：`'safe' | 'nai' | 'furry'`
- 默认值：`'nai'`

默认的生成模型。

### orient

- 类型：`'portrait' | 'square' | 'landscape'`
- 默认值：`'portrait'`

默认的图片方向。

### sampler

- 类型：`'k_euler_ancestral' | 'k_euler' | 'k_lms' | 'plms' | 'ddim'`
- 默认值：`'k_euler_ancestral'`

默认的采样器。

### anatomy

- 类型：`boolean`
- 默认值：`true`

默认情况下是否过滤不良构图。

### allowAnlas

- 类型：`boolean`
- 默认值：`true`

是否允许使用点数。禁用后部分功能 (如图片增强和步数设置) 将无法使用。

### basePrompt

- 类型: `string`
- 默认值: `'masterpiece, best quality'`

所有请求的附加标签。默认值相当于开启网页版的「Add Quality Tags」功能。

### forbidden

- 类型：`string`
- 默认值：`''`

违禁词列表。含有违禁词的请求将被拒绝。

### endpoint

- 类型：`string`
- 默认值：`'https://api.novelai.net'`

API 服务器地址。如果你搭建了私服，可以将此项设置为你的服务器地址。

### requestTimeout

- 类型：`number`
- 默认值：`30000`

当请求超过这个时间时会中止并提示超时。

### recallTimeout

- 类型：`number`
- 默认值：`0`

图片发送后自动撤回的时间 (设置为 `0` 禁用此功能)。
