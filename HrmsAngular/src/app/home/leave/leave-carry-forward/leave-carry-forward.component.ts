import { AuthService } from './../../../services/auth.service';
import { NgbDateCustomParserFormatter } from './../../../shared/dateformat';
import { EarnLeaveBalanceDetails } from './../../../models/leave/earn-leave-balance-details.model';
import { EarnLeaveBalance } from './../../../models/leave/earn-leave-balance.model';
import { SalarySetupService } from './../../../services/SalarySetup/salary-setup.service';
import { BasicEntryService } from './../../../services/system-setup/basic-entry.service';
import { BasicEntry } from './../../../models/system-setup/basic-entry.model';
import { Pagination } from './../../../shared/paginate';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { LeaveService } from '../../../services/leave.service';
import { ApiResponse } from '../../../models/response.model';
import { SalaryYear } from '../../../models/SalarySetup/salary-year';

@Component({
  selector: 'app-leave-carry-forward',
  templateUrl: './leave-carry-forward.component.html',
  styleUrls: ['./leave-carry-forward.component.scss',
  '../../../../vendor/libs/ng-select/ng-select.scss',
  '../../../../vendor/libs/angular2-ladda/angular2-ladda.scss'
]
})
export class LeaveCarryForwardComponent extends Pagination implements OnInit {

  isSearchBtnClick:boolean = false;
  isSaveBtnClick:boolean = false;
  isLoading:boolean = false;
  _compId:number;
  _gradeValue:number;
  _departments:BasicEntry[];
  _jobLocations:BasicEntry[];
  _salaryYears:SalaryYear[];

  _carryForwardForm:FormGroup;
  _carryForwardDetails:FormArray;

  constructor(
    private fb:FormBuilder,
    private modalService:NgbModal,
    private toaster:ToastrService,
    private dateFormat: NgbDateCustomParserFormatter,
    private basicService:BasicEntryService,
    private salaryService:SalarySetupService,
    private leaveService:LeaveService
  ) {
    super();
    this._carryForwardDetails = this.fb.array([]);
  }
  ngOnInit() {
    this._compId = AuthService.getLoggedCompanyId();
    this._gradeValue = AuthService.getLoggedGradeValue();

    this.sortDesc = false;

    this.createForm();
    this.getDepartments();
    this.getJobLocations();
    this.getSalaryYears();
  }

  getDepartments(){
    this.basicService.getDepartment().subscribe((response:ApiResponse)=>{
      if(response.status){
        this._departments = response.result as BasicEntry[];
        this.sortBy = 'description';
        this.sort(this._departments);
      }
    })
  }
  getJobLocations(){
    this.basicService.getBranch().subscribe((response:ApiResponse)=>{
      if(response.status){
        this._jobLocations = (response.result as BasicEntry[]);
        this.sortBy = 'description';
        this.sort(this._jobLocations);
      }
    })
  }
  getSalaryYears(){
    this.salaryService.getAllSalaryYear().subscribe((response:ApiResponse)=>{
      if(response.status){
        this._salaryYears =  response.result as SalaryYear[];
        this.sortBy = 'yearName';
        this.sort(this._salaryYears);
      }
    })
  }
  getCarryForwardDetails(){
    this.isSearchBtnClick = true;
    if(this._carryForwardForm.get('fromYear').invalid){
      this.toaster.error('Fill all required field!', 'Invalid Submission!');
      return;
    }

    let frmVal = this._carryForwardForm.value;
    let param:EarnLeaveBalance = new EarnLeaveBalance();
    param.department = frmVal.department;
    param.jobLocation = frmVal.jobLocation;
    param.yearID = frmVal.fromYear;
    param.companyID = this._compId;
    param.grade = this._gradeValue;
    param.executeType = -1 //this value set according to stored procedure to get carry forward
    this.leaveService.getCarryForwardOrEncashment(param).subscribe((response:ApiResponse)=>{
      if(response.status){
        this.isSearchBtnClick = false;
        this.isLoading = false;
        let model = response.result as EarnLeaveBalanceDetails[];
        this._carryForwardDetails = this.fb.array([]);
        model.forEach(item=>{
          this._carryForwardDetails.push(
            new FormGroup({
              empCode: new FormControl(item.empCode,[Validators.required]),
              empName: new FormControl(item.empName, []),
              department: new FormControl(item.department, []),
              designation: new FormControl(item.designation, []),
              typeName: new FormControl(item.typeName,[]),
              maxDays:new FormControl(item.maxDays, []),
              tOtalLeave:new FormControl(item.tOtalLeave),
              avaieled:new FormControl(item.avaieled,[]),
              qty: new FormControl(item.qty,[Validators.required]),
              leaveTypeID:new FormControl(item.leaveTypeID,[])
          })
          )
        })
      }else{
        this.toaster.error(response.result)
        this.isLoading = false;
      }
    });
  }

  onSubmit(){
    this.isSaveBtnClick = true;
    if(this._carryForwardForm.invalid || this._carryForwardDetails.invalid){
      this.toaster.error('Fill all required field!', 'Invalid Submission!');
      return;
    }

    let model:EarnLeaveBalance = new EarnLeaveBalance();
    model.date = this.dateFormat.ngbDateToDate(this._carryForwardForm.value.dateNgb).toLocaleDateString();
    model.yearID = this._carryForwardForm.value.toYear;
    model.companyID = this._compId;
    model.details = this._carryForwardDetails.value;
    this.leaveService.saveCarryForward(model).subscribe((response:ApiResponse)=>{
      if(response.status){
        this.isSaveBtnClick = false;
        this.toaster.success(response.result, 'Success!');
      }else{
        this.toaster.error(response.result, 'Failed!');
      }
    })

  }
  removeRow(rowIndex){
    this._carryForwardDetails.removeAt(rowIndex);
  }

  createForm(){
    this._carryForwardForm = this.fb.group({
      department: [,[]],
      jobLocation:[,[]],
      dateNgb:[this.dateFormat.getCurrentNgbDate(),[]],
      fromYear:[,[Validators.required]],
      toYear: [,[Validators.required]]
    })
  }

}
