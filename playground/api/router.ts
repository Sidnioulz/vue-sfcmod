import { spawnSync } from 'child_process'
import os from 'os'
import path from 'path'

import Router from '@koa/router'
import fs from 'fs-extra'

import { ROOT_DIR } from './constants'
import { getMeta } from './controllers'

const router = new Router()
const cmdSuffix = os.platform() === 'win32' ? '.cmd' : ''

router.get('/', (ctx) => {
  ctx.body = 'Hello'
})

router.get('/meta', async (ctx) => {
  ctx.body = await getMeta()
})

router.get('/files/(.*)', async (ctx) => {
  const filepath = path.join(ROOT_DIR, ctx.params[0])
  if (fs.existsSync(filepath)) {
    ctx.body = await fs.readFile(filepath, 'utf-8')
  } else {
    ctx.status = 404
  }
})

router.post('/files/(.*)', async (ctx) => {
  const filepath = path.join(ROOT_DIR, ctx.params[0])
  await fs.ensureDir(path.dirname(filepath))
  await fs.writeFile(filepath, ctx.request.body, 'utf-8')
  ctx.status = 200
})

router.post('/run/:trans', async (ctx) => {
  const name = ctx.params.trans
  const input = ctx.request.body
  const script = path.resolve(__dirname, 'transfrom.ts')

  const result = spawnSync(`ts-node${cmdSuffix}`, ['-T', script, name], {
    input,
    encoding: 'utf-8',
  })

  const { stderr, stdout } = result

  if (stderr) {
    ctx.body = `/* ERROR */\n\n${stderr}\n`
  } else {
    ctx.body = stdout
  }
})

export { router }
