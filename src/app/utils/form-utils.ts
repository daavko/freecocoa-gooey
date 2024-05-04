import { AbstractControl, FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';

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

export const maxOther =
    (other: FormControl): ValidatorFn =>
    (control): ValidationErrors | null => {
        if (other.value === null || control.value === null) {
            return null;
        }
        return control.value >= other.value ? { maxOther: true } : null;
    };

export function addErrorIfNotPresent(control: AbstractControl, errorName: string): void {
    if (!control.hasError(errorName)) {
        control.setErrors({
            ...control.errors,
            [errorName]: true
        });
    }
}

export function removeErrorIfPresent(control: AbstractControl, errorName: string): void {
    if (control.hasError(errorName)) {
        const errors = { ...control.errors };
        delete errors[errorName];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
}

export function passErrorToDescendants(
    parentControl: AbstractControl,
    children: AbstractControl[],
    errorName: string
): void {
    if (parentControl.hasError(errorName)) {
        children.forEach((child) => {
            addErrorIfNotPresent(child, errorName);
            child.markAsTouched();
        });
    } else {
        children.forEach((child) => removeErrorIfPresent(child, errorName));
    }
}
