import { Request, Response } from 'express';
import { teamService } from './team.service';

export const teamController = {
  async getTeams(req: Request, res: Response) {
    const { data, meta } = await teamService.listTeamsV3(req.query);
    res.json({ data, meta });
  },

  async getTeamMembers(req: Request, res: Response) {
    const { accountId } = req.params;

    const { data } = await teamService.listTeamMembersV3(accountId);

    res.json({ data });
  },

  async getTeamMembersTreeView(req: Request, res: Response) {
    const { accountId } = req.params;
    const data = await teamService.getTeamViewAndRanks(accountId);
    res.json(data);
  },

  async getTeamStats(req: Request, res: Response) {
    const { totalTeam, totalGv, totalActiveTeam, averageGV } = await teamService.getTeamStats();

    res.json({
      total_team: totalTeam,
      total_gv: totalGv,
      total_active_team: totalActiveTeam,
      average_gv: averageGV,
    });
  },
};
