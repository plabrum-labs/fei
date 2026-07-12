variable "account_id" { type = string }
variable "name" { type = string }
variable "production_branch" { type = string }
variable "github_owner" { type = string }
variable "github_repo_name" { type = string }
variable "root_directory" { type = string }
variable "build_command" {
  type    = string
  default = ""
}
variable "destination_dir" {
  type    = string
  default = "dist"
}

variable "domains" {
  description = "Custom domains to attach to this Pages project"
  type        = list(string)
  default     = []
}

variable "production_env" {
  type    = map(string)
  default = {}
}

variable "preview_env" {
  type    = map(string)
  default = {}
}
