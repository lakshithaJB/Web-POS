using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartERP.Application.Common.Interfaces;

namespace SmartERP.Api.Controllers;

[ApiController]
[Route("api/products")]
[Authorize]
public class ProductsController(IAppDbContext db) : ControllerBase
{
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] Guid locationId)
    {
        var results = await db.Products
            .Where(p => p.LocationId == locationId && p.IsActive &&
                (p.Name.Contains(q) || p.Barcode.Contains(q) || p.Code.Contains(q) ||
                 (p.PluCode != null && p.PluCode.Contains(q))))
            .Take(50)
            .ToListAsync();
        return Ok(results);
    }

    [HttpGet("barcode/{barcode}")]
    public async Task<IActionResult> GetByBarcode(string barcode, [FromQuery] Guid locationId)
    {
        var product = await db.Products
            .FirstOrDefaultAsync(p => p.Barcode == barcode && p.LocationId == locationId && p.IsActive);
        if (product is null) return NotFound();
        return Ok(product);
    }
}