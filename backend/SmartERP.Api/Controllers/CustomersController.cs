using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartERP.Application.Common.Interfaces;
using SmartERP.Domain.Entities;
using SmartERP.Domain.Enums;

namespace SmartERP.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomersController(IAppDbContext db) : ControllerBase
{
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        var tenantId = Guid.Parse(User.FindFirst("tenantId")!.Value);
        var results = await db.Customers
            .Where(c => c.TenantId == tenantId &&
                (c.Name.Contains(q) || c.Mobile.Contains(q) || c.Code.Contains(q)))
            .Take(20)
            .ToListAsync();
        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var customer = await db.Customers.FindAsync(id);
        if (customer is null) return NotFound();
        return Ok(customer);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest req)
    {
        var tenantId = Guid.Parse(User.FindFirst("tenantId")!.Value);
        var count = await db.Customers.CountAsync(c => c.TenantId == tenantId);

        var customer = new Customer
        {
            TenantId = tenantId,
            Code = $"C{(count + 1):D6}",
            Name = req.Name,
            Mobile = req.Mobile,
            Email = req.Email,
            Status = CustomerStatus.Active,
        };

        db.Customers.Add(customer);
        await db.SaveChangesAsync();
        return Ok(customer);
    }

    public record CreateCustomerRequest(string Name, string Mobile, string? Email);
}