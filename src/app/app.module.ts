// base angular
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';

// material modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

// ngrx
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

// components
import { AppComponent } from './app.component';
import { RulesetPickerComponent } from './components/ruleset-picker/ruleset-picker.component';
import { ToolPickerComponent } from 'src/app/components/util-picker/tool-picker.component';
import { AttackerFormComponent } from './components/attacker-form/attacker-form.component';
import { DefenderFormComponent } from './components/defender-form/defender-form.component';
import { CombatSimulatorComponent } from './components/combat-simulator/combat-simulator.component';

// misc
import { environment } from 'src/environments/environment';

// state app imports
import { rulesetStateAppImports } from 'src/app/state/ruleset/public-api';
import { appStateAppImports } from 'src/app/state/app/public-api';

@NgModule({
    declarations: [
        AppComponent,
        RulesetPickerComponent,
        AttackerFormComponent,
        DefenderFormComponent,
        CombatSimulatorComponent,
        ToolPickerComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatButtonModule,
        MatInputModule,
        MatCheckboxModule,
        MatSliderModule,
        MatProgressSpinnerModule,
        MatCardModule,
        MatIconModule,
        MatToolbarModule,
        StoreModule.forRoot({}, {}),
        EffectsModule.forRoot([]),
        !environment.production ? StoreDevtoolsModule.instrument({ maxAge: 25 }) : [],
        ...appStateAppImports,
        ...rulesetStateAppImports
    ],
    providers: [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }],
    bootstrap: [AppComponent]
})
export class AppModule {}
