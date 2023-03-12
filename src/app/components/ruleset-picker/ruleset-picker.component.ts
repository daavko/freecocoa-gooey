import { ChangeDetectionStrategy, Component } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { RulesetPreset, rulesetPresets } from 'src/app/components/ruleset-picker/ruleset-picker.model';
import { RulesetFacade } from 'src/app/state/ruleset/public-api';
import { LoadingState } from 'src/app/utils/utility-types';
import { isValidUrl, noGithubComUrl } from 'src/app/utils/form-utils';

@Component({
    selector: 'app-ruleset-picker',
    templateUrl: './ruleset-picker.component.html',
    styleUrls: ['./ruleset-picker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RulesetPickerComponent {
    public readonly rulesetPresets = rulesetPresets;

    public pickerForm = new FormGroup({
        baseUrl: new FormControl<string>({ value: '', disabled: false }, [
            Validators.required,
            isValidUrl,
            noGithubComUrl
        ])
    });
    public readonly readonlyInputs$: Observable<boolean>;

    public readonly loadState$: Observable<LoadingState>;

    constructor(private rulesetFacade: RulesetFacade) {
        this.loadState$ = this.rulesetFacade.rulesetLoadingState$;
        this.readonlyInputs$ = combineLatest([this.loadState$]).pipe(map(([loadState]) => loadState === 'loading'));
    }

    public loadRulesetPreset(preset: RulesetPreset): void {
        this.rulesetFacade.loadRuleset(preset.baseUrl, 'preset', preset.label);
    }

    public loadCustomRuleset(): void {
        const { baseUrl } = this.pickerForm.getRawValue();

        if (baseUrl === null) {
            throw new Error('this should never happen');
        }

        this.rulesetFacade.loadRuleset(baseUrl, 'custom', 'Custom ruleset');
    }

    public isInvalid(control: AbstractControl): boolean {
        return control.touched && control.invalid;
    }

    public getError(control: AbstractControl): string {
        if (control.hasError('required')) {
            return 'Value must not be empty';
        } else if (control.hasError('invalidUrl')) {
            return control.getError('invalidUrl') as string;
        } else if (control.hasError('noGithubComUrl')) {
            return control.getError('noGithubComUrl') as string;
        } else {
            return '';
        }
    }
}
