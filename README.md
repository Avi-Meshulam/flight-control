# flight-control
![alt text](https://github.com/PrisonerM13/flight-control/blob/master/gif/flight-control.gif "flight-control")

The application consists of 3 projects, combined in a VS Code workspace:
1. control-tower (UI Client) - [Angular 4](https://angular.io/)
2. simulator (flights generator) - [node.js](https://nodejs.org/en/), [express](https://expressjs.com/)
3. DAL - node.js, express, [mongoose 4](http://mongoosejs.com/)

> Communication between UI and Simulator is done via bidirectional socket ([socket.io](https://github.com/socketio/socket.io),  [socket.io-client](https://github.com/socketio/socket.io-client))
		
> Communication between UI/Simulator and DAL is done via HTTP.
		
Additional technologies/tools:
		
- Observables: [rxjs](http://reactivex.io/documentation/observable.html)
- Graphics: SVG (map/planes/routes). Tool: [Inkscape](https://inkscape.org/en/)
- Animation: [anime.js](https://github.com/juliangarnier/anime)
- UI design: [Bootstrap 3](https://getbootstrap.com/docs/3.3/)
- Settings UI: [bootstrap-slider](https://github.com/seiyria/bootstrap-slider) & [ngx-ui-switch](https://github.com/webcat12345/ngx-ui-switch)
- Right-click menus: [jquery-contextmenu](https://github.com/swisnl/jQuery-contextMenu)
- HTTP communication between simulator and DAL: [request-promise](https://github.com/request/request-promise)
- [jQuery](https://jquery.com/)

## Install & Run Instructions:

#### 1. Install software:
- [Download](https://nodejs.org/en/) & Install Node.js, LTS release
- [Download](https://www.mongodb.com/download-center?jmp=nav#community) & Install MongoDB
- Add MongoDB bin folder to user or system path (instructions are for Windows):
	1. Open Environment Variables window:
		+ Command line: "rundll32 sysdm.cpl,EditEnvironmentVariables"
		
			**OR**
		
		+ Control Panel --> System --> Advanced system settings --> Environment Variables (button at bottom)
	2. select "Path" from User or System variables and click the "Edit" button beneath.
	3. click "New" and type or paste MongoDB bin folder (e.g. "C:\Program Files\MongoDB\Server\3.4\bin").
	4. click "OK"
	5. click "OK" again
		
	> Alternativly you can run the following SETX command in cmd.exe, **but be aware(!) that SETX truncates the stored path to 1024 bytes, potentially corrupting your PATH environment variable**:
		
	> SETX /m PATH "%PATH%;C:\Program Files\MongoDB\Server\3.4\bin"

- Create folders for MongoDB on the disk where it was installed:
	- C:\data\db
	- C:\data\log

- Optional:
	- [Download](https://studio3t.com/download-thank-you/?OS=win64) & Install Studio 3T (MongoDB Management Studio, i.e. GUI for mongoDB):

#### 2. Install packages (this might take several minutes, depending on your hardware):
- Option 1: Open command prompt in 'control-tower' folder and type 'npm install'.
- Option 2: Double click on 'install.bat' in 'flight-control' folder.

![alt text](https://github.com/PrisonerM13/flight-control/blob/master/gif/EasyInstallation.gif "Easy Installation")
		
#### 3. Run program:
- Option 1: Open command prompt in 'control-tower' folder and type 'npm start'.
- Option 2: Double click on 'run.bat' in 'flight-control' folder.
		
![alt text](https://github.com/PrisonerM13/flight-control/blob/master/gif/EasyStartup.gif "Easy Startup")

> "npm install" & "npm start" respectively install & run all 3 projects (control-tower, simulator and DAL).
		
> While mongoDB is loaded (mongod) for the first time, you will be asked to "Allow access". Press "OK".

## Operations:

#### Settings Panel:
- Simulator Switch - Start/Stop generation of new flights.
- Speed Percentage - Speed range as percentage from max. speed (zero delay time)
		
	> Planes speed is not constant. It's chosen randomly for each move between airport legs.
		
	> The bigger the difference between min and max speed, the bigger the chance of collisions in 'Risky' mode (see below).
		
	> Recommended values: min: ~92%, max: ~98%.
- Safety Mode:
	- Pessimistic - Planes are allowed to move only when preceding plane reaches his leg.
	- Optimistic - Planes are allowed to move as soon as preceding plane confirms move, excluding runaway track.
	- Risky - Planes are allowed to move as soon as preceding plane confirms move, including runaway track.
- Radio response time - Delay in response in communication between control-tower & planes.
- Simulator Interval Range - Interval range for generating new flights.

#### Queues Panel:
- Right click on a flight code in "Arrivals" or "Emergencies" queues to set emergency on/off.

#### Map Panel:
- Right click on a plane image in legs 1-3 (in air arriving flights) to set emergency on/off.
- Right click a leg (1-9) to close/reopen it.

![alt text](https://github.com/PrisonerM13/flight-control/blob/master/gif/CloseLegOpenLeg.gif "Close Leg/Open Leg")