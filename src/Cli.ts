import { Command, CommandSpec } from './Command'
import { DisplayLevel } from './Display'
import { parseArgv } from './parseArgv'
import { PresenterFactory, LogPresenter, HelpPresenter, VersionPresenter } from './Presenter'
import { createCommand, getCommand } from './util'

export class Cli {
  static PresenterFactory: PresenterFactory = new PresenterFactory()
  cwd: string
  options = {
    boolean: {
      'help': {
        description: 'Print help message',
        alias: ['h']
      },
      'version': {
        description: 'Print the CLI version',
        alias: ['v']
      },
      'verbose': {
        description: 'Turn on verbose logging',
        alias: ['V']
      },
      'silent': {
        description: 'Turn off logging'
      }
    }
  }
  commands: Command[]
  displayLevel: DisplayLevel
  private ui: LogPresenter & HelpPresenter & VersionPresenter
  constructor(public name: string, public version: string, commandSpecs: CommandSpec[], context = { cwd: process.cwd() }) {
    const cwd = this.cwd = context.cwd
    this.ui = Cli.PresenterFactory.createCliPresenter(this)
    this.commands = commandSpecs.map(s => {
      const cmd = createCommand(s, { cwd })
      cmd.ui = Cli.PresenterFactory.createCommandPresenter(cmd)
      cmd.parent = this
      return cmd
    })
  }

  parse(rawArgv: string[]) {
    const args = parseArgv(this, rawArgv.slice(1))
    this.process(args, rawArgv.slice(1))
  }

  private process(args, rawArgv) {
    if (args.version) {
      this.ui.showVersion(this.version)
    }
    else {
      const command = getCommand(args._.shift(), this.commands)
      if (!command) {
        this.ui.showHelp(this)
      }
      else if (args.help) {
        command.ui.showHelp(command)
      }
      else {
        const displayLevel = args.verbose ?
          DisplayLevel.Verbose : args.silent ?
            DisplayLevel.Silent : DisplayLevel.Normal
        command.ui.setDisplayLevel(displayLevel)
        const cmdArgs = rawArgv.slice(1).filter(x => ['--verbose', '-V', '--silent'].indexOf(x) === -1)
        command.run(cmdArgs)
      }
    }
  }
}
