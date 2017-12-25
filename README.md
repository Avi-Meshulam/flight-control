# flight-control
![alt text](https://github.com/PrisonerM13/flight-control/blob/master/gif/flight-control.gif "flight-control")

The application consists of 3 projects, combined in a VS Code workspace:
1. control-tower (UI Client) - [Angular 4](https://angular.io/)
2. simulator (flights generator) - [node.js](https://nodejs.org/en/), [express](https://expressjs.com/)
3. DAL - node.js, express, [mongoose 4](http://mongoosejs.com/)

> Communication between UI and Simulator is done via bidirectional socket ([socket.io](https://github.com/socketio/socket.io),  [socket.io-client](https://github.com/socketio/socket.io-client))
		
> Communication between UI/Simulator and DAL is done via HTTP.
		
## Overview
+ When the user switches on the simulator, the simulator starts emitting flight transmissions. Each transmission includes a request for landing/departing and some flight data (flight code, airline, destination etc.).

+ The client (tower) listens to those requests and starts handling them. If there’s an available relevant leg (terminal leg for departures flight and entering leg for arrivals), the tower immediately directs the flight to enter the that leg. Otherwise, it adds the flight to a waiting queue, until its turn arrives. Either way, the simulator keeps sending the same request, until getting a response from the tower. When it receives the response, the simulator deletes the flight from its lists and turns further handling to tower.

+ When a flight is in one of the airport's legs, it waits for directions to move to the next leg. The flight signifies the tower upon receiving directions, and upon reaching the target leg. Then, it waits again until leaving the airport. 
Flights precedence is determined based on waiting time. The longer a flight waits, the higher priority it gets. If two flights has the same waiting time, priority is given to flights in landing leg (leg no. 3), then to departing flights and otherwise to an arbitrary flight.

+ If a flight announces an emergency state, it gets the highest priority (emergency is relevant to in-air arriving flights, i.e. out-of-airport arriving flights or flights in legs 1-3). If there is more than one arriving flight in emergency, flights are pushed into an emergency queue. When a flight in emergency lands, its emergency status is canceled.

+ The client/tower can close a leg, and if possible, continue moving flights. Currently, it is not possible to move flights backwards. It might be relevant for arriving flights, moving towards a terminal leg, while that leg is closed. Technically, it's not a problem to add backwards logic, but it implies some changes in terms of animation.

+ Both client and simulator save their data in DB and therefore can always recover from unexpected shutdown. If the database is not reachable, the tower stops handling requests, since it must constantly update the DB in order to be able to recover (technically, it is possible to temporarily save the data to a local file and then sync with the database). When the simulator exhausts its data, it refills its lists with the same data again, so it keeps transmitting infinitivally.
		
Features/Technologies/Tools:
		
- Observables: [rxjs](http://reactivex.io/documentation/observable.html)
- Graphics: SVG (map/planes/routes). Tool: [Inkscape](https://inkscape.org/en/)
- Animation: [anime.js](https://github.com/juliangarnier/anime)
- UI design: [Bootstrap 3](https://getbootstrap.com/docs/3.3/)
- Settings UI: [bootstrap-slider](https://github.com/seiyria/bootstrap-slider) & [ngx-ui-switch](https://github.com/webcat12345/ngx-ui-switch)
- Right-click menus: [jquery-contextmenu](https://github.com/swisnl/jQuery-contextMenu)
- HTTP communication between simulator and DAL: [request-promise](https://github.com/request/request-promise)
- mongoose discriminators on both collection level and field level
- [jQuery](https://jquery.com/)

## Install & Run Instructions:

### 1. Install software:
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
		
	> Alternativly you can run the following SETX command in cmd.exe, **but be aware(!) - SETX truncates the stored path to 1024 bytes, potentially corrupting your PATH environment variable**:
		
	> SETX /m PATH "%PATH%;C:\Program Files\MongoDB\Server\3.4\bin"

- Create folders for MongoDB on the disk where it was installed:
	- C:\data\db
	- C:\data\log

- Optional:
	- Download  & Install GUI application for mongoDB, e.g. [Studio 3T](https://studio3t.com/download-thank-you/?OS=win64)

### 2. Install packages (this might take several minutes, depending on your hardware):
- Option 1: Open command prompt in 'control-tower' folder and type 'npm install'.
- Option 2: Double click on 'install.bat' in 'flight-control' folder.
		
	#### Easy Installation
	![alt text](https://github.com/PrisonerM13/flight-control/blob/master/gif/EasyInstallation.gif "Easy Installation")
		
### 3. Run program:
- Option 1: Open command prompt in 'control-tower' folder and type 'npm start'.
- Option 2: Double click on 'run.bat' in 'flight-control' folder.

	#### Easy Startup
	![alt text](https://github.com/PrisonerM13/flight-control/blob/master/gif/EasyStartup.gif "Easy Startup")
		
> "npm install" & "npm start" respectively install & run all 3 projects (control-tower, simulator and DAL).
		
> While mongoDB is loaded (mongod) for the first time, you will be asked to "Allow access". Press "OK".

## User Interface

### Communication Panel
#### Simulating radio transmissions between control tower and flights
![alt text](https://github.com/PrisonerM13/flight-control/blob/master/gif/Communication.gif "Communication")

### Settings Panel
![alt text](https://github.com/PrisonerM13/flight-control/blob/master/images/Settings.png "Settings Panel")
		
- Simulator Switch - Start/Stop generation of new flights.
- Speed Range - Speed range as percentage out of max. speed (zero delay time)
		
	> Planes speed is not constant. It's chosen randomly for each move between airport legs.
		
	> The bigger the difference between min and max speed, the bigger the chance of collisions in 'Risky' safety mode (see below).
		
	> Recommended values: min: ~92%, max: ~98%.
- Safety Mode:
	- Pessimistic - Planes are allowed to move only when preceding plane reaches his leg.
	- Optimistic - Planes are allowed to move as soon as preceding plane confirms move, excluding runaway track.
	- Risky - Planes are allowed to move as soon as preceding plane confirms move, including runaway track.
- Radio response time - Delay in response in communication between control-tower & planes.
- Simulator Interval Range - Interval range for generating new flights.

### Queues Panel
- Right click on a flight code in "Arrivals" or "Emergencies" queues to set emergency on/off.
		
	#### Set Emergency On/Off
	![alt text](https://github.com/PrisonerM13/flight-control/blob/master/gif/Emergency.gif "Set Emergency On/Off")

### Map Panel
- Right click on a plane image in legs 1-3 (in air arriving flights) to set emergency on/off.
- Right click a leg (1-9) to close/reopen it.
		
	#### Close/Open Leg
	![alt text](https://github.com/PrisonerM13/flight-control/blob/master/gif/CloseLegOpenLeg.gif "Close Leg/Open Leg")
		
## DB structure
![alt text](https://github.com/PrisonerM13/flight-control/blob/master/images/Diagram.png "DB Schema")
		
| Collection          | Description   
| ------------------- | ------------- 
| arrivals            | Arrivals queue. Contains all flights that requested to start landing process.
| departues           | Departures queue. Contains all flights that requested to start departing process.
| legs                | Current state of airport legs, including leg's id/number, type, state, open/close status, and occuping flight, if any.
| flightLog           | One record for for every change in flight data: flight's status, emergency state, location (legId).
| settings            | Application's settings, as displayed in settings panel.
| simulatorarrivals   | Simulator's arrivals storage, initiated from a data file in simulator project. A flight that enters airport or added to arrivals queue is deleted from this collection. When the collection is empty, it is refilled again from the project's data file.
| simulatordepartures | Same as simulator's arrivals storage, but for departures.
		
> MONGODB_URI=mongodb://localhost:27017/flight-control
		
> PORT=3000
		
> Routes pattern: MONGODB_URI/{collection name}
		
#### 'legs' collection's 'flight' field, hosts both arriving and departing flights, discriminated by key named 'direction':
![alt text](https://github.com/PrisonerM13/flight-control/blob/master/images/legs-details.png "Legs Collection Details")
		
#### 'flightLog' collection hosts both arriving and departing flights, discriminated by key named 'direction':
![alt text](https://github.com/PrisonerM13/flight-control/blob/master/images/flightLog.png "flightLog Collection")
		
### Leg States
| State               | Description  
| ------------------- | -----------
| Unoccupied          | 
| Move Direction Sent | A flight was directed to enter leg, but has not yet confirmed.
| Move Confirmed      | A flight confirmed directions to enter leg.
| Marked For Save     | Leg should be saved for a flight, once that flight confirms directions.
| Saved               | Leg is saved for a flight that confirmed directions.
| Occupied            | Leg is occupied by a flight.
		
![alt text](https://github.com/PrisonerM13/flight-control/blob/master/images/legs.png "Legs Collection")
		
### Flight Status
| Status   | Description
| -------- | -----------
| OnTime   | Flight is on schedule (default)
| Delay    | Flight is behind schedule (currently not in use)
| Departed | Flight left airport's air space
| Landed   | Flight entered terminal and is no longer under tower's supervision
