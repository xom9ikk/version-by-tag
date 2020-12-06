import * as core from '@actions/core';
import * as github from '@actions/github';
import { exec } from '@actions/exec';
import * as semver from 'semver';

import {
  IAddOffsetToVersionCode,
  ICalculateVersionCode,
  IGetInput,
  IGetStdoutFromExec,
  IGetTagByPath,
  IMain,
  ITagToSemver,
} from './interfaces';

// Warning: The greatest value Google Play allows for versionCode is 2100000000.
// max            2100000000
// 99.999.9999 => 999999999 => 99 999 9999

const maxPatchCount = 1000;
const maxMinorCount = 1000;

const calculateVersionCode: ICalculateVersionCode = ({
  major, minor, patch,
}) => {
  const patchPart = patch;
  const minorPart = minor * maxPatchCount;
  const majorPart = major * maxMinorCount * maxPatchCount;
  return majorPart + minorPart + patchPart;
};

const addOffsetToVersionCode: IAddOffsetToVersionCode = (
  versionCode, offset,
) => versionCode + offset;

const tagToSemver: ITagToSemver = (tag) => {
  const normalizedSemver = semver.coerce(tag);
  const isValid = semver.valid(normalizedSemver);
  if (!isValid) {
    throw new Error(`Invalid semver from tag: ${tag}`);
  }
  return normalizedSemver;
};

const getStdoutFromExec: IGetStdoutFromExec = async (command, args, workDir) => {
  let output = '';
  let error = '';
  const options = {
    cwd: workDir,
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
      stderr: (data: Buffer) => {
        error += data.toString();
      },
    },
  };
  await exec(command, args, options);
  if (error) {
    throw new Error(error);
  }
  return output;
};

const getTagByPath: IGetTagByPath = async (path) => {
  await exec('git', ['fetch', '--prune', '--unshallow'], { cwd: path });
  const tag = await getStdoutFromExec('git', ['describe', '--tags', '--abbrev=0'], path);
  return tag.trim();
};

const getInput: IGetInput = () => {
  const path = core.getInput('path') || './';
  const isUseGithubRunNumber = core.getInput('isUseGithubRunNumber') === 'true';
  const offset = parseInt(core.getInput('offset'), 10);
  const { runNumber } = github.context;

  return {
    path,
    isUseGithubRunNumber,
    offset,
    runNumber,
  };
};

const main: IMain = async ({
  path,
  isUseGithubRunNumber,
  offset,
  runNumber,
}) => {
  const tag = await getTagByPath(path);
  const semverFromTag = tagToSemver(tag);
  const versionCode = calculateVersionCode(semverFromTag);
  const versionCodeWithRunNumber = addOffsetToVersionCode(versionCode, runNumber);
  const versionCodeWithOffset = addOffsetToVersionCode(versionCode, offset);
  const resultedVersionCode = offset > 0
    ? versionCodeWithOffset
    : isUseGithubRunNumber
      ? versionCodeWithRunNumber
      : versionCode;

  core.setOutput('tag', tag);
  core.setOutput('semver', semverFromTag.raw);
  core.setOutput('versionCode', resultedVersionCode);
};

(async () => {
  try {
    const input = getInput();
    await main(input);
  } catch (error) {
    core.setFailed(error.message);
  }
})();
