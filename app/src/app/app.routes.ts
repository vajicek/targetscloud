import { Routes } from '@angular/router';

import { LoginScreenComponent } from './screens/loginscreen/loginscreen.component';
import { MainScreenComponent } from './screens/mainscreen/mainscreen.component';
import { TrainingsComponent } from './screens/trainings/trainings.component';
import { NewTrainingComponent } from './screens/newtraining/newtraining.component';
import { SettingsComponent } from './screens/settings/settings.component';
import { TrainingDetailComponent } from './screens/trainingdetail/trainingdetail.component';
import { TrainingComponent } from './screens/training/training.component';
import { GroupsComponent } from './screens/groups/groups.component';
import { FriendsComponent } from './screens/friends/friends.component';
import { ChatComponent } from './screens/chat/chat.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
	{ path: '', redirectTo: '/login', pathMatch: 'full' },
	{ path: 'login', component: LoginScreenComponent },
	{ path: 'main', component: MainScreenComponent, canActivate: [AuthGuard] },
	{ path: 'trainings', component: TrainingsComponent, canActivate: [AuthGuard] },
	{ path: 'newtraining', component: NewTrainingComponent, canActivate: [AuthGuard] },
	{ path: 'trainingdetail', component: TrainingDetailComponent, canActivate: [AuthGuard] },
	{ path: 'groups', component: GroupsComponent, canActivate: [AuthGuard] },
	{ path: 'friends', component: FriendsComponent, canActivate: [AuthGuard] },
	{ path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
	{ path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
	{ path: 'training', component: TrainingComponent, canActivate: [AuthGuard] },
];
