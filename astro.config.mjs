// @ts-check
import { defineConfig } from 'astro/config';

const [owner, repository] = (process.env.GITHUB_REPOSITORY ?? '/').split('/');
const githubPages = Boolean(owner && repository);
const userSite = repository === `${owner}.github.io`;

export default defineConfig({
	...(githubPages && {
		site: `https://${owner}.github.io`,
		base: userSite ? '/' : `/${repository}`,
	}),
});
