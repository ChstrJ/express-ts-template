import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export const getEmailTemplate = (fileName: string) => {
  const emailPath = path.join('src', 'views', 'emails', fileName);
  return fs.readFileSync(emailPath, 'utf-8');
};

export const compileEmailTemplate = (template: string, data: any) => {
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(data);
};
