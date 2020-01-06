import { JSONTypes, KeyofOptional } from 'type-plus'
import { HelpPresenter, Inquirer, LogPresenter, VersionPresenter } from '../presenter/types'

export type Cli = {
  name: string,
  version: string,
  /**
   * parse process.argv
   */
  parse(argv: string[]): Promise<any>,
}

export namespace Cli {
  export type ConstructOptions<
    Config extends Record<string, JSONTypes> | undefined,
    Context,
    N1 extends string,
    N2 extends string,
    N3 extends string,
    N4 extends string,
    O extends Options<N2, N3, N4> = Options<N2, N3, N4>
    > = ConstructOptionsBase<Config, Context> & ({
      name: string,
      description: string,
      arguments?: Argument<N1>[],
      options?: O,
      commands?: Command<Config, Context>[],
      run: RunFn<Config, Context, N1, N2, N3, N4, O>
    } | {
      commands: Command<Config, Context>[],
    })

  export type ConstructOptionsBase<
    Config extends Record<string, JSONTypes> | undefined,
    Context,
    > = {
      name: string,
      version: string,
      /**
       * The default config for the cli.
       * The config will be available to the cli and its command at `this.config`.
       * If specified, the configuration will be loaded from `<cli-name>.json` (or `<configName>.json` if specified).
       */
      config?: Config,
      /**
       * Specify the config name if differs from the cli name.
       * e.g. name = `cli`,
       * configName = `my-cli`,
       * will load config from `my-cli.json`
       */
      configName?: string,
      /**
       * A context that the cli and its commands will have access to (at `this`).
       */
      context?: Context,
    }

  export type RunFn<
    Config,
    Context,
    N1 extends string,
    N2 extends string,
    N3 extends string,
    N4 extends string,
    O extends Options<N2, N3, N4> = Options<N2, N3, N4>
    > = (this: RunContext<Config, Context>, args: RunArgs<N1, N2, N3, N4, O>, argv: string[]) => Promise<any> | any

  export type Command<
    Config extends Record<string, JSONTypes> | undefined = undefined,
    Context extends Partial<BuildInContext> & Record<string | symbol, any> = Partial<BuildInContext>,
    Name extends string = string,
    Name1 extends string = string,
    Name2 extends string = string,
    Name3 extends string = string,
    O extends Options<Name1, Name2, Name3> = Options<Name1, Name2, Name3>
    > = {
      name: string,
      description: string,
      arguments?: Argument<Name>[],
      options?: O,
      alias?: string[],
    } & ({
      commands?: Command<Config, Context>[],
      run(this: RunContext<Config, Context>, args: RunArgs<Name, Name1, Name2, Name3, O>, argv: string[]): Promise<any> | any,
    } | {
      commands: Command<Config, Context>[],
    })

  export type RunContext<Config, Context> = {
    name: string,
    version: string,
    ui: LogPresenter & HelpPresenter & VersionPresenter & Inquirer,
    config: Config,
    cwd: string
  } & Omit<Context, 'ui' | 'cwd'>

  export type RunArgs<
    Name extends string = string,
    Name1 extends string = string,
    Name2 extends string = string,
    Name3 extends string = string,
    O extends Options<Name1, Name2, Name3> = Options<Name1, Name2, Name3>
    > = DefaultArgs & ArgumentNamesRecord<Argument<Name>> & Record<KeyofOptional<O['boolean']>, boolean> & Record<KeyofOptional<O['string']>, string> & Record<KeyofOptional<O['number']>, number>

  export type DefaultArgs = {
    help: boolean
  }

  export type Argument<Name extends string = string> = {
    name: Name,
    description?: string,
    required?: boolean,
    multiple?: boolean,
  }

  export type ArgumentNamesRecord<A extends Argument<string>> = { [K in A['name']]: string }

  export type Options<
    N1 extends string = string,
    N2 extends string = string,
    N3 extends string = string
    > = {
      boolean?: Record<N1, TypedOptions<boolean>>,
      string?: Record<N2, TypedOptions<string>>,
      number?: Record<N3, TypedOptions<number>>,
    }

  export type TypedOptions<T> = {
    description: string,
    alias?: string[],
    default?: T,
    /**
     * An option group this option belongs to.
     * If the option belongs to a group and one of the options has be set,
     * the other options will not have their default value.
     */
    group?: string,
  }

  export type BuildInContext = {
    ui: LogPresenter & HelpPresenter & VersionPresenter & Inquirer,
    cwd: string
  }
}
