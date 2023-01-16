import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Subject, switchMap, tap } from 'rxjs';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RulesetLoadState, RulesetPresetName, rulesetPresets } from 'src/app/models/ruleset-picker.model';
import { RulesetFetchService } from 'src/app/services/ruleset-fetch.service';
import { CombatCalculationService } from 'src/app/services/combat-calculation.service';

const isValidUrl: ValidatorFn = (control): ValidationErrors | null => {
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

const noGithubComUrl: ValidatorFn = (control): ValidationErrors | null => {
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

@Component({
    selector: 'app-ruleset-picker',
    templateUrl: './ruleset-picker.component.html',
    styleUrls: ['./ruleset-picker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RulesetPickerComponent implements OnInit {
    public pickerForm = new FormGroup({
        preset: new FormControl<RulesetPresetName>({ value: 'none', disabled: false }),
        effectsUrl: new FormControl<string>({ value: '', disabled: false }, [
            Validators.required,
            isValidUrl,
            noGithubComUrl
        ]),
        terrainUrl: new FormControl<string>({ value: '', disabled: false }, [
            Validators.required,
            isValidUrl,
            noGithubComUrl
        ]),
        unitsUrl: new FormControl<string>({ value: '', disabled: false }, [
            Validators.required,
            isValidUrl,
            noGithubComUrl
        ])
    });
    public readonly readonlyInputs$ = this.pickerForm.controls.preset.valueChanges.pipe(
        map((value) => value !== 'none')
    );

    private readonly loadState = new BehaviorSubject<RulesetLoadState>('beforeLoad');

    public readonly loadState$ = this.loadState.asObservable();

    constructor(private rulesetFetch: RulesetFetchService, private combatCalculator: CombatCalculationService) {}

    public ngOnInit(): void {
        this.pickerForm.controls.preset.valueChanges.subscribe((value) => {
            if (value !== null) {
                const { effectsUrl, terrainUrl, unitsUrl } = rulesetPresets[value];
                this.pickerForm.controls.effectsUrl.setValue(effectsUrl);
                this.pickerForm.controls.terrainUrl.setValue(terrainUrl);
                this.pickerForm.controls.unitsUrl.setValue(unitsUrl);
            }
        });
        this.loadState$.subscribe((value) => {
            if (value === 'loading') {
                this.pickerForm.disable();
            } else {
                this.pickerForm.enable();
            }
        });
    }

    public loadRuleset(): void {
        this.loadState.next('loading');
        const { effectsUrl, terrainUrl, unitsUrl } = this.pickerForm.getRawValue();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- safe, we validate beforehand
        this.rulesetFetch.fetchRuleset(effectsUrl!, terrainUrl!, unitsUrl!).subscribe({
            next: (ruleset) => {
                this.combatCalculator.setRuleset(ruleset);
                this.loadState.next('loaded');
            },
            error: (error: unknown) => {
                console.error(error);
                this.loadState.next('error');
            }
        });
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
