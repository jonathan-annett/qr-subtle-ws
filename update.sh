cd ../subtle-crypto-window/
npm run-script build
git add index.js @.js
git commit -m "auto update"
git push
cd ../qr-subtle-ws/
git add index.js @.js
./update_git_repos.sh push
