(function () {
  if (getAppVersion() >= 3196) {
    //https://hjdhnx.coding.net/public/hiker/hiker/git/files/master/js/dr.js
    //https://hjdhnx.coding.net/api/user/hjdhnx/project/hiker/shared-depot/dr/git/blob/master/js/dr.js
    //https://dr.playdreamer.cn/js/dr.js

    $.extend({
      _rootUrl: "https://dr.playdreamer.cn/libs/",
      rc(url, is_blob) {
        if (/^hiker:\/\/|^file:\/\/|^\/storage\/|^\/sdcard\//.test(url)) {
          if (/^\/storage\/|^\/sdcard\//.test(url)) {
            url = "file://" + url;
          }
          return eval.call(null, fetch(url));
        } else if (/^http/.test(url)) {
          if (
              !(/coding\.net/.test(url) && /git\/files\/|git\/blob\//.test(url))
          ) {
            return require(url);
          } else {
            is_blob =
                typeof is_blob === "undefined"
                    ? /git\/blob\//.test(url)
                    : is_blob;
            let md5_path = `hiker://files/libs/${md5(url)}.js`;
            if (!fileExist(md5_path)) {
              try {
                var rurl = is_blob ? url : this.getBlob(url);
                var res = JSON.parse(request(rurl, { timeout: 5000 }));
                var file = res.data.file.data;
              } catch (e) {
                throw new Error("获取远程依赖" + url + "失败!" + e.message);
              }
              writeFile(md5_path, file);
              // log('下载处理:'+url+',写到:'+md5_path);
              let rec = JSON.parse(readFile("require.json", 0) || "[]");
              let obj = {
                url: url,
                file: getPath(md5_path).slice(7),
                accessTime: new Date().getTime(),
              };
              let idex = rec.findIndex((it) => it.url === url);
              if (idex > -1) {
                rec[idex] = obj;
              } else {
                rec.push(obj);
              }
              log("开始保存依赖信息:" + JSON.stringify(rec));
              saveFile("require.json", JSON.stringify(rec), 0);
            }
            //log('执行本地文件:'+md5_path);
            return eval.call(null, fetch(md5_path));
          }
        } else {
          throw new Error(
              "链接地址有误!必须是本地文件地址或者http开头的远程链接!"
          );
        }
      },
      getBlob(url) {
        let globalKey = function (url) {
          var A = getHome(url).split("//")[1].split(".");
          return A.length < 3 ? "" : A[0];
        };
        let project = url.match(/public\/(.*?)\//)[1];
        let ext = url
            .split(`public/${project}/`)[1]
            .replace("/git/files/", "/git/blob/");
        let blobUrl =
            getHome(url) +
            "/api/user/" +
            globalKey(url) +
            "/project/" +
            project +
            "/shared-depot/" +
            ext;
        //log(realUrl);
        return blobUrl;
      },
      setRoot(url) {
        //设置远程根目录
        initConfig({
          _rootUrl: url || this._rootUrl,
        });
      },
      getRoot() {
        // 获取当前远程根目录
        return config._rootUrl;
      },
      setLib(obj) {
        //设置依赖文件映射字典
        let root = this.getRoot();
        if (typeof obj === "object") {
          for (let i in obj) {
            obj[i] = obj[i].startsWith("http") ? obj[i] : root + obj[i];
          }
        }
        initConfig({
          lib: obj || {},
        });
      },
      getLib() {
        // 获取依赖文件映射字典
        return config.lib || {};
      },
      url(url) {
        //获取文件相对远程目录的绝对路径
        return (config._rootUrl || "") + url;
      },
    });
  }
})();
