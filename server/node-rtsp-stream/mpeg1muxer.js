var Mpeg1Muxer, child_process, events, util

child_process = require('child_process')

util = require('util')

events = require('events')

Mpeg1Muxer = function(options) {
  var key
  this.inputStream = options.inputStream
  this.ffmpegOptions = options.ffmpegOptions
  this.exitCode = undefined
  this.additionalFlags = []
  if (this.ffmpegOptions) {
    for (key in this.ffmpegOptions) {
      this.additionalFlags.push(key)
      if (String(this.ffmpegOptions[key]) !== '') {
        this.additionalFlags.push(String(this.ffmpegOptions[key]))
      }
    }
  }
  this.spawnOptions = [
    '-re',
    '-threads', '4',                        //工作线程数
    '-r', '30',
    '-f','image2pipe',                         
    '-avioflags','direct',                  //无缓冲
    '-fpsprobesize',0,
    '-analyzeduration',0,                    //指定解析媒体所需要花销的时间，这里设置的值越高，解析的越准确，如果在直播中为了降低延迟，这个可以设置得低一些
    '-c:v','mjpeg',                         //输入源格式
    '-i','pipe:0',                          //标准输入管道
    '-an',                                  //无音频
    '-f','mpegts',
    '-fflags', 'nobuffer',                  //无缓冲
    '-codec:v','mpeg1video',                //编码格式
    // '-codec:v', 'libx264',
    '-vf', 'crop=iw-mod(iw\\,2):ih-mod(ih\\,2)',
    '-b:v','1500k',                          //视频码率
    '-bf','0',                              //设置非B帧之间的B帧个数
    '-g','20',                               //gop cache
    '-sc_threshold','0',                    //禁用场景识别
    ...this.additionalFlags,
    // '-f', 'flv',
    '-threads', '4',                        //工作线程数
    'pipe:1'                                //标准输出管道
  ];
  this.stream = child_process.spawn(options.ffmpegPath, this.spawnOptions, {
    detached: true,
    stdio: ['pipe', 'pipe', 'inherit']
  })
  // pipe stream
  this.inputStreamStarted = true;
  this.stream.stdout.on('data', (data) => {
    return this.emit('mpeg1data', data)
  })
  // this.stream.stderr.on('data', (data) => {
  //   return this.emit('ffmpegStderr', data)
  // })
  this.stream.on('exit', (code, signal) => {
    if (code === 1) {
      console.error('RTSP stream exited with error')
      this.exitCode = 1
      return this.emit('exitWithError')
    }
  })
  this.inputStream.pipe(this.stream.stdin);
  return this
}

util.inherits(Mpeg1Muxer, events.EventEmitter)

module.exports = Mpeg1Muxer
