import * as path from 'path';
import * as fs   from 'fs';

export interface PackageJSON {
  version:string;
  description:string;
  bin:any;
}

function loadPackageJSON():PackageJSON {
  const root:string         = path.resolve(__dirname, ".", "..");
  const fileContents:Buffer = fs.readFileSync(root + '/package.json');
  return JSON.parse(fileContents.toString('utf8'));
}

export const packageConfig:PackageJSON = loadPackageJSON();
