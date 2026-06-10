import * as yup from 'yup';

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const loginSchema = yup.object({
  email: yup
    .string()
    .required('validation.emailRequired')
    .email('validation.emailInvalid'),
  password: yup
    .string()
    .required('validation.passwordRequired')
    .min(6, 'validation.passwordMin'),
});

export const registerSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .required('validation.firstNameRequired')
    .min(2, 'validation.firstNameMin'),
  lastName: yup
    .string()
    .trim()
    .required('validation.lastNameRequired')
    .min(2, 'validation.lastNameMin'),
  email: yup
    .string()
    .required('validation.emailRequired')
    .email('validation.emailInvalid'),
  password: yup
    .string()
    .required('validation.passwordRequired')
    .min(6, 'validation.passwordMin'),
});
