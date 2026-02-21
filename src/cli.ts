import { Command } from 'commander';
import { testCommand } from './commands/test';

const program = new Command();

program.addCommand(testCommand);

program.parse(process.argv);
