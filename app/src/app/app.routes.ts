import { Routes } from '@angular/router';

import { LoginscreenComponent } from './screens/loginscreen/loginscreen.component';
import { MainscreenComponent } from './screens/mainscreen/mainscreen.component';

export const routes: Routes = [
	{ path: 'login', component: LoginscreenComponent },
	{ path: 'main', component: MainscreenComponent },
];
