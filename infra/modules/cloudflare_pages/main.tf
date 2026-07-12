terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

resource "cloudflare_pages_project" "main" {
  account_id        = var.account_id
  name              = var.name
  production_branch = var.production_branch

  source {
    type = "github"
    config {
      owner                         = var.github_owner
      repo_name                     = var.github_repo_name
      production_branch             = var.production_branch
      deployments_enabled           = true
      production_deployment_enabled = true
      pr_comments_enabled           = true
    }
  }

  build_config {
    build_command   = var.build_command
    destination_dir = var.destination_dir
    root_dir        = var.root_directory
  }

  deployment_configs {
    production {
      environment_variables = var.production_env
    }
    preview {
      environment_variables = var.preview_env
    }
  }
}

resource "cloudflare_pages_domain" "main" {
  for_each     = toset(var.domains)
  account_id   = var.account_id
  project_name = cloudflare_pages_project.main.name
  domain       = each.value
}
