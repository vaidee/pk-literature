# SPEC-12 --- CI/CD

GitHub Actions. Pipeline: Lint -\> Test -\> Build -\> Terraform Plan -\>
Approval -\> Terraform Apply -\> Deploy OpenNext -\> Deploy Lambdas -\>
Deploy ECS -\> Smoke Tests. Branch strategy: main, develop, feature/\*.
Acceptance: One-click automated deployment.
