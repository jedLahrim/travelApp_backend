import { Matches, ValidationOptions } from 'class-validator';

export class AppError {
  code: string;
  message?: string;

  constructor(code: string, message?: string) {
    this.code = code;
    this.message = message;
  }
}

export class CustomMatches {
  pattern: RegExp;
  validationOptions?: ValidationOptions;

  constructor(pattern: RegExp, validationOptions: ValidationOptions & any) {
    this.pattern = pattern;
    this.validationOptions = validationOptions;
  }
}

new CustomMatches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
  message: 'password is too weak',
  mes: '',
});

export const CustomMatches1 = (
  pattern: RegExp,
  validationOptions?: ValidationOptions,
) => {
  validationOptions = {};
  validationOptions.message = 'Message';
  return Matches(pattern, validationOptions);
};
