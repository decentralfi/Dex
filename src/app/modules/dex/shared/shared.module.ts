import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/*Angular Flex box*/
import { FlexLayoutModule } from '@angular/flex-layout';

/*Font Awesome*/
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

/*Angular Material*/
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatChipsModule} from '@angular/material/chips';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatRippleModule} from '@angular/material/core';
import {MatCheckboxModule} from '@angular/material/checkbox';

/* NgSelect*/
import { NgSelectModule } from '@ng-select/ng-select';

/*Shared Components*/
import { LoaderComponent } from './loader/loader.component';
import { InfoBarComponent } from '../shared/components/info-bar/info-bar.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { HeaderComponent } from '../shared/components/header/header.component';
/* Pipe for long values */
import { RoundedValuePipe } from '../shared/pipes/rounded-value.pipe';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    FontAwesomeModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NgSelectModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatRippleModule,
    MatCheckboxModule
  ],
  declarations: [
    LoaderComponent,
    InfoBarComponent,
    FooterComponent,
    HeaderComponent,
    RoundedValuePipe,
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    LoaderComponent,
    FlexLayoutModule,
    FontAwesomeModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NgSelectModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatRippleModule,
    MatCheckboxModule,
    RoundedValuePipe,
    InfoBarComponent,
    FooterComponent,
    HeaderComponent
  ],
})
export class SharedModule { }
