import { Component, NgZone, OnInit } from '@angular/core';
import { UserInfoService } from '../user-info.service';
// import * as firebase from 'firebase';
import { AngularFireDatabase } from '@angular/fire/database';
import { ActivatedRoute, Router } from '@angular/router';
import { Route } from '@angular/compiler/src/core';
import { EventsService } from '../events.service';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  uInfo: any;
  alertList: any;
  sharedAlerts : any
  uid: any;
  map:any = {};
  constructor(private uInfoProvider: UserInfoService, private afData: AngularFireDatabase, public ngZone: NgZone,
    public route: ActivatedRoute, public router: Router, public events: EventsService, private afAuth: AngularFireAuth
    ) { 
    this.sharedAlerts = []
    this.events.subscribe('user:loaded',(data: any) => {
      this.uInfo = data
      this.uid = this.uInfo.uid
      console.log("big data",this.uInfo)
      // this.afData.database.ref("alerts").child(this.uid).get().then( (data) =>{
      //   this.ngZone.run(() => {
      //     this.alertList = data.val()
      //   })
      //   this.afData.database.ref("users").child(this.uid).get().then( (data2) =>{
      //     this.uInfo = data2.val()
      //   })
      //   console.log("got data!",this.alertList)
      // } )
      if(this.uInfo){
        this.uid = this.uInfo.uid
      }
      // this.loadAlerts()
    })

    // this.events.subscribe('user:hasId',(data: any) => {
    //   this.uid = data
    //   // console.log("big data",this.uid)
    //   this.loadAlerts()
    // })

    // this.loadUserData()
 
    // this.uInfoProvider.usrData.subscribe(data =>{
    //   console.log("observation triggered")
    // })
  }

  ngOnInit() {
    // console.log("ngonInit")
    if(this.uInfoProvider.getUserId()){
      this.uInfoProvider.setUserInfoById(this.uInfoProvider.getUserId())
    }
    // this.ngZone.run(this.loadAlerts)
    // this.loadUserData()
  }

  ionViewWillEnter(){
    // this.ngZone.run( () =>{
    //   this.loadAlerts()
    // }) 
    // this.loadAlerts()
    // this.loadUserData()
    this.loadAlerts()
  }

  loadAlerts(){
    this.alertList = this.uInfoProvider.getUserAlerts()
    this.uInfo = this.uInfoProvider.getUserInfo();
    if(this.alertList == undefined || (this.uInfo == undefined && this.uid == undefined)){
      // console.log("id",this.uid)
      setTimeout(() => {
        this.loadAlerts()
      }, 1000);
    }else{
      this.afData.database.ref("addresses").on("child_added", datasnap =>{
        this.loadSharedAlerts(datasnap)
        // console.log("child_added key",datasnap.key)

        // console.log("child_added val", datasnap.val())
      })
      this.afData.database.ref("addresses").on("child_changed",datasnap =>{
        this.loadSharedAlerts(datasnap)
        // console.log("child_changed key", datasnap.key)
        // console.log("child_changed val", datasnap.val())
      })
    }
    return
  }


  isAddressInList(addr){
    let alertObjs = []
    for(let index in this.alertList){
      if(this.alertList[index].address == addr){
         alertObjs.push(this.alertList[index])
      }
    }
    return alertObjs
  }

  getKey(data){
    let keys = []
    for(let tempKey in data){
       keys.push(tempKey)
    }
    return keys
  }

  loadSharedAlerts(datasnap){
    let usrIds = this.getKey(datasnap.val()) //get all the userIds out the object
    // console.log("all the ids",usrIds)
    let selfAlertObjs = this.isAddressInList(datasnap.key) // the object that contains all the alert objects that match address
    // console.log("cats",selfAlertObj,key)
    for(let usrIndex in usrIds){
      if( selfAlertObjs.length > 0 && usrIds[usrIndex] != this.uid){ //if self has addresses matches the given address and usrId diff
        // console.log("first if statement")
        let alertObjs = datasnap.val()[usrIds[usrIndex]] //get all the alertObjs given a usrId
        // console.log("first obj",alertObjs)
        // console.log("second obj", selfAlertObjs)
        for(let key2 in alertObjs){ 
          for(let key3 in selfAlertObjs){
            if(alertObjs[key2].hasRona == true && alertObjs[key2].data.date == selfAlertObjs[key3].date){
              let otherStart = parseInt(alertObjs[key2].data.startHour)
              let selfStart = parseInt(selfAlertObjs[key3].startHour)
              let otherEnd = parseInt(alertObjs[key2].data.endHour)
              let selfEnd = parseInt(selfAlertObjs[key3].endHour)
              if( (otherStart <= selfStart && otherEnd >= selfStart) ||
                  (otherStart <= selfEnd && otherEnd >= selfEnd) ||
                  (selfStart <= otherStart && selfEnd >= otherStart) ||
                  (selfStart <= otherEnd) && selfEnd >= otherEnd
              ){
                alertObjs[key2]["isCritical"] = true
                alertObjs[key2]["style_class"] = "card-header-danger"
              }else{
                alertObjs[key2]["isCritical"] = false
                alertObjs[key2]["style_class"] = "card-header-secondary"
              }
              alertObjs[key2]["key"]= key2
              this.ngZone.run( () =>{
                let doPush = true
                for(let i in this.sharedAlerts){
                  if(this.sharedAlerts[i]["key"] == key2){
                    doPush = false 
                  }
                }
                if(doPush){
                  // console.log("why push",alertObjs[key2])
                  // console.log(selfAlertObjs[key3])
                  // console.log(usrIds[usrIndex])
                  if(!(alertObjs[key2].data.address in this.map )){
                    this.sharedAlerts = [alertObjs[key2]].concat(this.sharedAlerts)
                    this.map[alertObjs[key2].data.address] = true
                  }

                  // this.sharedAlerts.push(
                  //   alertObjs[key2]
                  // )
                }
              })
              
            }
          }
        }
        // console.log(this.sharedAlerts,"shared alerts")
      }
    }

    }
    // for(let obj in this.sharedAlerts){
    //   console.log(this.sharedAlerts[obj])
    // }

  }

