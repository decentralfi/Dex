import { Component, OnInit, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-forget-wallet',
  templateUrl: './forget-wallet.component.html',
  styleUrls: ['./forget-wallet.component.scss']
})
export class ForgetWalletComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ForgetWalletComponent>
  ) { }

  ngOnInit() {
  }

  closeDialog(bool){
    this.dialogRef.close(bool);
  }

}
