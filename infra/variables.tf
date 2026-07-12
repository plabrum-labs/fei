variable "cloudflare_api_token" {
  description = "Cloudflare API token scoped to Zone:DNS:Edit + Account:Cloudflare Pages:Edit on plabrum.com / plabrum-labs account"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the plabrum.com zone and Pages projects"
  type        = string
  default     = "42ea0d21baf84d2a10e66a9ff0a421cc"
}

variable "github_owner" {
  description = "GitHub org/user that owns the repo"
  type        = string
  default     = "plabrum-labs"
}

variable "github_repo_name" {
  description = "GitHub repository name"
  type        = string
  default     = "fei"
}

variable "production_branch" {
  description = "Git branch to deploy to production"
  type        = string
  default     = "main"
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for plabrum.com - only used for the fei DNS record, not the rest of the zone"
  type        = string
  default     = "7fedab7551876c0be5a98385f1042460"
}
