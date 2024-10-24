import { Routes } from '@angular/router';

import { LoginscreenComponent } from './screens/loginscreen/loginscreen.component';
import { MainscreenComponent } from './screens/mainscreen/mainscreen.component';
import { TrainingsComponent } from './screens/trainings/trainings.component';
import { NewtrainingComponent } from './screens/newtraining/newtraining.component';
import { SettingsComponent } from './screens/settings/settings.component';
import { TrainingdetailComponent } from './screens/trainingdetail/trainingdetail.component';
import { TrainingComponent } from './screens/training/training.component';
import { GroupsComponent } from './screens/groups/groups.component';
import { FriendsComponent } from './screens/friends/friends.component';
import { ChatComponent } from './screens/chat/chat.component';

export const routes: Routes = [
	{ path: '', redirectTo: '/login', pathMatch: 'full' },
	{ path: 'login', component: LoginscreenComponent },
	{ path: 'main', component: MainscreenComponent },
	{ path: 'trainings', component: TrainingsComponent },
	{ path: 'newtraining', component: NewtrainingComponent },
	{ path: 'trainingdetail', component: TrainingdetailComponent },
	{ path: 'groups', component: GroupsComponent },
	{ path: 'friends', component: FriendsComponent },
	{ path: 'chat', component: ChatComponent },
	{ path: 'settings', component: SettingsComponent },
	{ path: 'training', component: TrainingComponent },
];
