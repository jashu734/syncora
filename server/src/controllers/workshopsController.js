import { workshopsService } from '../services/workshopsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const workshopsController = {
  /**
   * GET /api/workshops
   */
  getAllWorkshops: asyncHandler(async (req, res) => {
    const workshops = await workshopsService.getAllWorkshops();
    return res.status(200).json({
      data: workshops
    });
  }),

  /**
   * GET /api/workshops/:id
   */
  getWorkshopById: asyncHandler(async (req, res) => {
    const workshopId = Number(req.params.id);
    const workshop = await workshopsService.getWorkshopById(workshopId);
    return res.status(200).json({
      data: workshop
    });
  })
};

export default workshopsController;
