import { findByKeywords } from 'find-installed-packages'
import findUp from 'find-up'
import path from 'path'
import type { cli, PluginActivationContext } from './cli'
import { createUI } from './ui'

export async function loadPlugins({ cwd, ui }: { cwd: string, ui: createUI.UI }, keyword: string) {
  ui.debug(`lookup local plugins with keyword '${keyword}' at ${cwd}`)
  const findingLocal = findByKeywords([keyword], { cwd }).then(pluginNames => {
    if (pluginNames.length > 0) ui.debug('found local plugins', pluginNames)
    else ui.debug(`no local plugin with keyword: ${keyword}`)
    return pluginNames
  })

  const globalFolder = getGlobalPackageFolder(__dirname)
  ui.debug(`lookup global plugins with keyword '${keyword}' at ${globalFolder}`)
  const findingGlobal = findByKeywords([keyword], { cwd: globalFolder }).then(globalPluginNames => {
    if (globalPluginNames.length > 0) ui.debug('found global plugins', globalPluginNames)
    else ui.debug(`no global plugin with keyword: ${keyword}`)
    return globalPluginNames
  })

  return Promise.all([findingLocal, findingGlobal]).then(([localPluginsNames, globalPluginNames]) => {
    const commands = activatePlugins(cwd, ui, localPluginsNames)
    commands.push(...activatePlugins(
      globalFolder,
      ui,
      globalPluginNames.filter(p => localPluginsNames.indexOf(p) === -1)))
    return commands
  })
}

function getGlobalPackageFolder(folder: string): string {
  const indexToFirstNodeModulesFolder = folder.indexOf('node_modules')
  // istanbul ignore next
  const basePath = indexToFirstNodeModulesFolder === -1 ? folder : folder.slice(0, indexToFirstNodeModulesFolder)
  // in NodeJS@6 the following fails tsc due to null is not assignable to string.
  // in this context the `findUp()` call should not fail and will not return null.
  return path.resolve(findUp.sync('node_modules', { cwd: basePath, type: 'directory' })!, '..')
}

function activatePlugins(cwd: string, ui: createUI.UI, pluginNames: string[]) {
  const commands: cli.Command<any, any>[] = []
  pluginNames
    .map(p => ({
      name: p,
      pluginModule: loadModule(cwd, ui, p),
    }))
    .filter(({ name, pluginModule }) => {
      if (!isValidPlugin(pluginModule)) {
        ui.warn('not a valid plugin', name)
        return false
      }
      return true
    })
    .forEach(({ name, pluginModule }) => {
      ui.debug('activating plugin', name)
      activatePlugin(pluginModule).forEach(cmd => {
        ui.debug('adding command', cmd.name)
        commands.push(cmd)
      })
      ui.debug('activated plugin', name)
    })
  return commands
}

function loadModule(cwd: string, ui: createUI.UI, name: string) {
  const pluginPath = path.resolve(cwd, 'node_modules', name)
  try {
    return require(pluginPath)
  }
  catch (e: any) {
    ui.warn(`Unable to load plugin from ${name}. Please let the plugin author knows about it.`)
    ui.warn(`plugin path: ${pluginPath}`)
    ui.warn(`error: `, e.message || e)
    return undefined
  }
}

function isValidPlugin(m: any) {
  return m && typeof m.activate === 'function'
}

function activatePlugin(m: { activate: (context: PluginActivationContext) => void }) {
  const commands: cli.Command[] = []
  m.activate({ addCommand: cmd => commands.push(cmd) })
  return commands
}
