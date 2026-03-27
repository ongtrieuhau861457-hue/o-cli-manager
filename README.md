# CLI Service Manager

CLI tool quan ly va thuc thi nghiep vu tren nhieu nen tang SaaS/Cloud
thong qua he thong Task Files va Plugin Services.

## Install

```bash
npm install
```

## Config

```bash
cp configs/supabase.example.yaml configs/supabase.yaml
# Dien accessToken vao configs/supabase.yaml
```

## Usage

```bash
node index.js              # Chay CLI tuong tac
node index.js --export-zip # Xuat code ZIP
node index.js --help       # Help
```

## Menu chinh

- **Chay Task File** — auto-discover `./tasks/*.yaml`, chon profile, run tu dong
- **Thao tac thu cong** — chon service, profile, multi-select actions, chay song song
- **Quan ly Config** — them/sua/xoa profile qua menu
- **Thoat**

## Add New Service

1. Tao `services/<ten>.js` theo interface chuan (xem `services/supabase.js`)
2. Tao `configs/<ten>.example.yaml`
3. Service tu dong xuat hien trong menu

## Task File Format

```yaml
name: ten-task
description: "Mo ta"
service: supabase
version: "1.0.0"

steps:
  - id: step_1
    action: listProjects
    type: sequential       # sequential | parallel
    on_error: stop         # stop | continue | retry:3
    params: {}

  - id: step_2
    action: getProjectApiKeys
    type: sequential
    on_error: continue
    params:
      project_ref: "{{ steps.step_1.output.data[0].id }}"
```

## Logs

`./logs/YYYY-MM-DD-<service>.log` — tu dong tao, sensitive fields bi mask.

## State

`./state/session.yaml` — tu dong tao, luu last-used choices.
