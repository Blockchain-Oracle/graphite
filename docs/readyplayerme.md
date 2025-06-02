# Ready Player Me Integration Guide

## Quickstart

Load your personal Ready Player Me avatar in your React project in less than 5 minutes.

### Before you begin

Sign in to [Studio (Developer Dashboard)](https://studio.readyplayer.me/) and copy your subdomain. This will allow you to create and load an avatar in your domain at a later step.

You can explore the implemented package on [Codesandbox](https://codesandbox.io/s/ready-player-me-react-avatar-creator-example-fibbf6).

### 1. Install the react-avatar-creator package

Ready Player Me - React Avatar Creator is available as an npm package. Run the following command in the root of your React project.

```bash
npm i @readyplayerme/react-avatar-creator
```

### 2. Configure the AvatarCreator

`AvatarCreator` component can take an `editorConfig` parameter, which helps you with this. The component uses an iframe to render the underlying Avatar Creator, and passes these parameters in the URL.

| Parameter | Type | Effect |
|-----------|------|--------|
| language | string | Sets the default language of the creator. |
| bodyType | "halfbody" \| "fullbody" | Instead of select page, starts with given option. |
| quickStart | boolean | Start with a quick start avatar selection. |
| clearCache | boolean | If disabled previous avatar will not be loaded. |

### 3. Receive the Avatar URL from AvatarCreator

After installing the npm package into your project, you can import the AvatarCreator Component and pass your subdomain as a parameter to load the Ready Player Me in your React project. You should also add an `onAvatarExported` callback to the component to receive the avatar's URL when exported.

```tsx
import { AvatarCreator, AvatarCreatorConfig, AvatarExportedEvent } from '@readyplayerme/react-avatar-creator';

const config: AvatarCreatorConfig = {
  clearCache: true,
  bodyType: 'fullbody',
  quickStart: false,
  language: 'en',
};

const style = { width: '100%', height: '100vh', border: 'none' };

export default function App() {
  const handleOnAvatarExported = (event: AvatarExportedEvent) => {
    console.log(`Avatar URL is: ${event.data.url}`);
  };

  return (
    <>
      <AvatarCreator subdomain="YOUR-SUBDOMAIN" config={config} style={style} onAvatarExported={handleOnAvatarExported} />
    </>
  );
}
```

If you want to sign up later, you can use `demo` as subdomain parameter.

### 4. Install Visage package to render your avatar

Ready Player Me Visage package enables you to render your avatar in the browser. This package is available as an npm package.

You can explore the react avatar creator with visage on [Codesandbox](https://codesandbox.io/s/ready-player-me-react-avatar-creator-visage-example-ybw49n).

Run the following command at the root of your React project.

```bash
npm i @readyplayerme/visage
```

### 5. Display your avatar

Using the code snippet below, you can display your avatar.

```tsx
import { AvatarCreator, AvatarCreatorConfig, AvatarExportedEvent } from '@readyplayerme/react-avatar-creator';
import { Avatar } from "@readyplayerme/visage";
import { useState } from "react";

const config: AvatarCreatorConfig = {
  clearCache: true,
  bodyType: 'fullbody',
  quickStart: false,
  language: 'en',
};

const style = { width: '100%', height: '100vh', border: 'none' };

export default function App() {
  const [avatarUrl, setAvatarUrl] = useState('');
  const handleOnAvatarExported = (event: AvatarExportedEvent) => {
    setAvatarUrl(event.data.url);
  };

  return (
    <>
      <AvatarCreator subdomain="demo" config={config} style={style} onAvatarExported={handleOnAvatarExported} />
      {avatarUrl && <Avatar modelSrc={avatarUrl} />}
    </>
  );
}
```

## Customizing Avatar Visuals

Visage offers a range of different rendering options that allow you to customize your avatar's visuals in lots of different ways. You can experiment with these rendering options here: [Visage Showcase](https://readyplayerme.github.io/visage/?path=/story/components-avatar--showcase)