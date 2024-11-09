/* eslint-disable no-inner-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isBrowser, isNode } from "./config.js";

export {
  savePrivateFile,
  readPrivateFile,
  setPrivateFolder,
  cleanLabel
};

let setPrivateFolder: (path: string) => void;
let savePrivateFile: (name: string, data: any) => void  ;
let readPrivateFile: (name: string) => any | null;
let privateDir = "";

// We use the FileSystem to save and read identity 
if (isNode) {
  const fs = await import('fs');
  const path = await import('path');

  const homeDir = process?.env.HOME || process?.env.HOMEPATH || process?.env.USERPROFILE;
  if (!homeDir) {
    throw new Error('Cannot determine home directory.');
  }

  // default, unless we change it using setPrivateDir()
  privateDir = path.join(homeDir, '.private');

  setPrivateFolder = (path: string) => {
    // on Node we use the path for storing the file
    privateDir = path;
  }
  
  savePrivateFile = (name: string, data: any): void => {
    try {
      if (!fs.existsSync(privateDir)) {
        fs.mkdirSync(privateDir);
      }
      const filePath = path.join(privateDir, `${name}.identity.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log('File has been saved to', filePath);
    } catch (err) {
      console.error('Error writing file:', err);
    }
  }
  
  readPrivateFile = (name: string): any | null => {
    try {
      const filePath = path.join(privateDir,  `${name}.identity.json`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonData: any = JSON.parse(fileContent);
      // console.log('File content:', jsonData);
      return jsonData;
    } catch (err) {
      console.error('Error reading file:', err);
      return null;
    }
  }  
}

// we use the LocalStorage to save and read identity 
if (isBrowser) {
  // default, unless we change it using setPrivateDir()
  privateDir = '.private';

  setPrivateFolder = (path: string) => {
    // on Browser we use this is a 'prefix' for LocalStorage
    privateDir = path;
  }

  savePrivateFile = (name: string, data: any): void => {
    try {
      if (!localStorage) throw Error("LocalStorage not available");
      if (!name || !data) throw Error("Missing name or data params");
      localStorage.setItem(`${privateDir}.${name}.identity`, 
        JSON.stringify(data)
      );
    }
    catch (err) {
      console.error('writePrivateFile: failed error=', err);
    }
  }
  
  readPrivateFile = (name: string): any | null => {
    try {
      if (!localStorage) throw Error("LocalStorage not available");
      if (!name) throw Error("Missing name param");
      let rs = localStorage.getItem(`${privateDir}.${name}.identity`);
      return (rs ? JSON.parse(rs) : null)
    }
    catch (err) {
      console.error('readPrivateFile: failed error=', err);
      return null;
    }
    return;
  }  
}

/** Removes all non-ASCII characters and spaces, for use as a filename */
function cleanLabel(input: string): string {
  // Remove all non-ASCII characters
  // eslint-disable-next-line no-control-regex
  let cleaned = input.replace(/[^\x00-\x7F]/g, '');
  // Replace spaces with underscores or remove them
  cleaned = cleaned.replace(/\s+/g, '_');
  // Optionally, remove any remaining characters that are not suitable for filenames
  // eslint-disable-next-line no-useless-escape
  cleaned = cleaned.replace(/[^a-zA-Z0-9_\-\.]/g, '');
  return cleaned;
}
