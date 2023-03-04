import { ValidationErrors, ValidatorFn } from '@angular/forms';

export const isValidUrl: ValidatorFn = (control): ValidationErrors | null => {
    const value: unknown = control.value;

    if (typeof value !== 'string') {
        return { invalidUrl: 'Value must be a string' };
    }
    try {
        new URL(value);
    } catch (e) {
        return { invalidUrl: 'Value must be a valid URL' };
    }

    return null;
};

export const noGithubComUrl: ValidatorFn = (control): ValidationErrors | null => {
    const value: unknown = control.value;

    if (typeof value !== 'string') {
        return { noGithubComUrl: 'Value must be a string' };
    }

    try {
        const url = new URL(value);
        if (url.hostname === 'github.com') {
            return { noGithubComUrl: 'Use raw.githubusercontent.com instead of github.com (due to CORS)' };
        }
    } catch (e) {
        return { noGithubComUrl: 'Value must be a valid URL' };
    }

    return null;
};
