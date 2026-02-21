import { Router } from 'express';
import { teamController } from './team.controller';

const router = Router();

router.get('/', teamController.getTeams);
router.get('/:accountId/members', teamController.getTeamMembers);
router.get('/:accountId/members/tree-view', teamController.getTeamMembersTreeView);
router.get('/stats', teamController.getTeamStats);

export default router;
