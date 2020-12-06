import { SemVer } from 'semver';

export interface IInput {
  path: string,
  isUseGithubRunNumber: boolean,
  offset: number,
  runNumber: number,
}

export type IGetInput = () => IInput;
export type IMain = (input: IInput) => void;
export type IGetTagByPath = (path: string) => Promise<string>;
export type IGetStdoutFromExec = (
  command: string, args?: Array<string>, workDir?: string
) => Promise<string>;
export type ITagToSemver = (tag: string) => SemVer;

export type ICalculateVersionCode = (semver: SemVer) => number;
export type IAddOffsetToVersionCode = (versionCode: number, offset: number) => number;
