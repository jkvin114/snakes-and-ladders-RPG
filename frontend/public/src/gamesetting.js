class SettingType{
	static GAMEPLAY=0
	static STAT=1
	static MATCH=2
}
class ToggleSetting{
	constructor(type,key,def,name){
		this.key=key
		this.type=type
		this.state=def
		this.name=name
	}
	toggle(){
		this.state=!this.state
	}
	draw(type,index){
		let parent=$("#gameplay .setting_category")
		if(type===SettingType.STAT){
			parent=$("#statistic .setting_category")
		}
		if(type===SettingType.MATCH){
			parent=$("#match .setting_category")
		}
		let str=`  
		<div class="onesetting">
			<div class="settingname-container">
			<a>${this.name}</a>
			</div>
			<div class="settingvalue">
			<label class="switch">
				<input type="checkbox" value="${index}" ${this.state?'checked=true':''}>
				<span class="slider"></span>
			</label>
			</div>
		</div> `
		// str="<div class='onesetting togglesetting'><a class='settingname'>"
		// str+=this.name
		// str+='</a><br><br><label class="switch"><input type="checkbox" value="'
		// str+=index
		// str+='"'
		// if(this.state===true){
		// 	str+=' checked=true '
		// }
		// str+=' ><span class="slider"></span></label></div>'

		$(parent).append(str)

	}
}
class RangeSetting{
	constructor(type,key,def,options,name,isnumber){
		this.type=type
		this.key=key
		this.state=def   //number
		this.options=options   //string[] or number[]
		this.upperbound=options.length-1
		if(isnumber){
			this.upperbound=options[options.length-1]
			this.lowerbound=options[0]
		}
		else{
			this.upperbound=options.length-1
			this.lowerbound=0
		}
		
		this.name=name
		this.isnumber=isnumber
	}
	set(num){
		this.state=Math.min(num,this.upperbound)
	}
	up(){
		this.state=Math.min(this.state+1,this.upperbound)
		
		return this.state === this.upperbound
	}
	down(){
		this.state=Math.max(this.state-1,this.lowerbound)
		return this.state === this.lowerbound
	}

	
	// setValue(){
	// 	switch(type){
	// 		case(SettingType.GAMEPLAY):
	// 		MATCH.gamesetting[this.name]=this.state
	// 		break
	// 	}
	// }
	getText(){
		if(this.isnumber){
			return this.state
		}
		else{
			return this.options[this.state]
		}
	}
	draw(type,index){
		let parent=$("#gameplay .setting_category")
		if(type===SettingType.STAT){
			parent=$("#statistic .setting_category")
		}
		if(type===SettingType.MATCH){
			parent=$("#match .setting_category")
		}
		let str=`
		<div class="onesetting rangesetting">
			<div class="settingname-container ">
			<a class='settingname'>${this.name}</a>
			</div>
			<div class="settingvalue">
				<button class="rangedown rangearrow" value="${index}">	&#9664;</button>
				<div class="rangevalue_wrapper"><a class="rangevalue">${this.getText()}</a></div>
				<button class="rangeup rangearrow" value="${index}">	&#9654;</button>
			</div>
		</div>  `
		// let str="<div class='onesetting rangesetting'><a class='settingname'>"
		// str+=this.name
		// str+='</a><br><br><button class="rangedown rangearrow" value="'
		// str+=index
		// str+='">	&#9664;</button> <div class="rangevalue_wrapper"><a class="rangevalue" >'
		// str+=this.getText()
		// str+='</a></div><button class="rangeup rangearrow " value="'
		// str+=index
		// str+='">&#9654;</button></div>'
		$(parent).append(str)
	}
}



class SettingStorage{
	constructor(){
		this.rangeSettings=[]   //RangeSetting[]
		this.toggleSettings=[]  //ToggleSetting[]
		this.rangeSettingElements=[]   //jquery dom elements[]
	}
	add(type,key,setting){
		let s
		if(setting.bound){
			s=new RangeSetting(type,key,setting.default,this.getOptions(setting),chooseLang(setting.desc,setting.desc_kor),true)
			s.draw(type,this.rangeSettings.length)
			this.rangeSettings.push(s)
			return {setting:s,index:this.rangeSettings.length-1}
		}
		else if(setting.options){
			s=new RangeSetting(type,key,setting.default,this.getOptions(setting),chooseLang(setting.desc,setting.desc_kor),false)
			s.draw(type,this.rangeSettings.length)
			this.rangeSettings.push(s)
			return {setting:s,index:this.rangeSettings.length-1}
		}
		else{
			s=new ToggleSetting(type,key,setting.default,chooseLang(setting.desc,setting.desc_kor))
			s.draw(type,this.toggleSettings.length)
			this.toggleSettings.push(s)
			return {setting:s,index:this.toggleSettings.length-1}
		}
	}
	getOptions(setting){
		if(setting.bound){
			let options=[]
			for(let i=setting.bound[0];i<=setting.bound[1];++i){
				options.push(i)
			}
			return options
		}
		else if(setting.options){
			return chooseLang(setting.options,setting.options_kor)
		}
	}

	getSummary(){
		let response={}
		for(let set of this.rangeSettings){
			response[set.key]=set.state
		}
		for(let set of this.toggleSettings){
			response[set.key]=set.state
		}
		return response
	}

	getSimulationSummary(){
		let response={}
		let gamesettings={}
		for(let set of this.rangeSettings){
			if(set.type===SettingType.GAMEPLAY){
				gamesettings[set.key]=set.state
			}
			else{
				response[set.key]=set.state
			}
			
		}
		for(let set of this.toggleSettings){
			if(set.type===SettingType.GAMEPLAY){
				gamesettings[set.key]=set.state
			}
			else{
				response[set.key]=set.state
			}
		}
		response['gameSetting']=gamesettings
		return response
	}

}
