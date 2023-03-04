import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppFacade, AppScreen } from 'src/app/state/app/public-api';
import { map, Observable } from 'rxjs';
import { RulesetFacade } from 'src/app/state/ruleset/public-api';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    public readonly screen$: Observable<AppScreen>;
    public readonly toolbarTitle$: Observable<string>;
    public readonly showBackToRulesetPickerButton$: Observable<boolean>;
    public readonly showBackToToolPickerButton: Observable<boolean>;

    constructor(private appFacade: AppFacade, private rulesetFacade: RulesetFacade) {
        this.screen$ = appFacade.screen$;
        this.toolbarTitle$ = appFacade.toolbarTitle$;
        this.showBackToRulesetPickerButton$ = appFacade.screen$.pipe(map((screen) => screen === 'toolPick'));
        this.showBackToToolPickerButton = appFacade.screen$.pipe(
            map((screen) => screen !== 'rulesetPick' && screen !== 'toolPick')
        );
    }

    public backToRulesetSelection(): void {
        this.appFacade.switchScreen('rulesetPick');
        this.rulesetFacade.reset();
    }

    public backToToolSelection(): void {
        this.appFacade.switchScreen('toolPick');
    }
}
