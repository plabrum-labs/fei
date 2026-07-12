terraform {
  required_version = ">= 1.6.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  # Backend config is passed via -backend-config flags in CI (terraform.yml).
  # State lives in marlin's existing state bucket under a plabrum-labs/ prefix,
  # accessed via the gha-terraform-labs OIDC role (scoped to that prefix only).
  backend "s3" {}
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

module "pages" {
  source = "./modules/cloudflare_pages"

  account_id        = var.cloudflare_account_id
  name              = "fei"
  production_branch = var.production_branch
  github_owner      = var.github_owner
  github_repo_name  = var.github_repo_name
  root_directory    = "apps/web"
  build_command     = "cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @fei/web build"
  destination_dir   = "dist"

  domains = ["fei.plabrum.com"]
}

# Cloudflare Pages doesn't auto-create the custom domain's DNS record via API
# (only via the dashboard flow) - scoped to just this one record, not the zone.
resource "cloudflare_record" "fei" {
  zone_id = var.cloudflare_zone_id
  name    = "fei"
  type    = "CNAME"
  content = module.pages.subdomain
  ttl     = 1 # automatic (required when proxied)
  proxied = true
}

output "pages_project_name" {
  value = module.pages.project_name
}

output "pages_subdomain" {
  value = module.pages.subdomain
}
