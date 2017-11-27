# flight-control
flight-control is a MEAN full stack application, simulating a workflow of a flight control tower.
It is built with angular 4, node, express and mongoDB (via mongoose 4), and written with typescript end-to-end.

The application includes 3 separate projects (combined in a VS Code workspace):
1. control-tower (UI Client) - Angular 4
2. simulator (flights generator) - node.js, express
3. DAL - node.js, express, mongoose 4

- Communication between UI and Simulator is done via bidirectional socket.
- Communication between UI/Simulator and DAL is done via HTTP.

- Additional libraries/technologies:
	- Observables: rxjs
	- Graphics: SVG (map/planes/routes)
	- Animation: anime.js
	- UI design: Bootstrap 3
	- Settings UI: bootstrap-slider & ngx-ui-switch
	- Right-click menus: jquery-contextmenu
	- HTTP communication between simulator and DAL: request-promise
	- jQuery

Install & Run Instructions:
--------------------------

1. Install software:

  - Download & Install Node.js, LTS release, from:
    - https://nodejs.org/en/

  - Download & Install MongoDB from:
    - https://www.mongodb.com/download-center?jmp=nav#community

  - Add MongoDB bin folder to user/system path (instructions are for Windows):
  	- Open Environment Variables window:
    	- run the following command line: rundll32 sysdm.cpl,EditEnvironmentVariables
	  	- OR
    	- Open Windows Control Panel --> System --> Advanced system settings --> Environment Variables (button at bottom)
  	- then:
	    - select "Path" from User or System variables and click the "Edit" button beneath.
	    - click "New" and type or paste MongoDB bin folder (e.g. "C:\Program Files\MongoDB\Server\3.4\bin").
	    - click "OK"
	    - click "OK again"

	- Alternativly you can run the following command in cmd.exe, BUT be aware(!): 'setx' truncates the stored path to 1024 bytes, potentially corrupting your PATH environment variable:
		- setx /m PATH "%PATH%;C:\Program Files\MongoDB\Server\3.4\bin"

	- Create folders for MongoDB on the disk where it was installed:
		- C:\data\db
		- C:\data\log

  - Optional:
		- Download & Install Studio 3T (MongoDB Management Studio, i.e. GUI for mongoDB):
			- https://studio3t.com/download-thank-you/?OS=win64

2. Install packages (this might take several minutes, depending on your hardware):
	- Option 1: Open command prompt in 'control-tower' folder and type 'npm install'.
	- Option 2: Double click on 'install.bat' in 'flight-control' folder.

3. Run program:
	- Option 1: Open command prompt in 'control-tower' folder and type 'npm start'.
	- Option 2: Double click on 'run.bat' in 'flight-control' folder.

-	Remarks:
	- "npm install" & "npm start" respectively install & run all 3 projects (control-tower, simulator, DAL).
	- While mongoDB is loaded (mongod) for the first time, you will be asked to "Allow access". Press "OK".

Program Instructions:
--------------------

- Settings Panel:
	- Simulator Switch - Start/Stop generation of new flights.
	
	- Speed Percentage - Speed range as percentage from max. speed (zero delay time)
		- Planes speed is not constant. It's chosen randomly for each move between airport legs.
		- The bigger the difference between min and max speed, the bigger the chance of collisions in 'Risky' mode (see below).
		- Recommended values: min: ~92%, max: ~98%.

	- Safety Mode:
		- Pessimistic - Planes are allowed to move only when preceding plane reaches his leg.
		- Optimistic - Planes are allowed to move as soon as preceding plane confirms move, excluding runaway track.
		- Risky - Planes are allowed to move as soon as preceding plane confirms move, including runaway track.

  - Radio response time - Delay in response in communication between control-tower & planes.

  - Simulator Interval Range - Interval range for generating new flights.

- Queues Panel:
  - Right click on a flight code in "Arrivals" or "Emergencies" queues to set emergency on/off.

- Map Panel:
  - Right click on a plane image in legs 1-3 (in air arriving flights) to set emergency on/off.
  - Right click a leg (1-9) to close/reopen it.
