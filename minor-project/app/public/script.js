
let mic, recorder, soundFile = null, blob;

function setup() {
    mic = new p5.AudioIn();
    mic.start();
    recorder = new p5.SoundRecorder();
    recorder.setInput(mic);
    soundFile = new p5.SoundFile();
}

$(function() {

    let chooseFile = null;

    document.getElementById("input-file").addEventListener("change", (e) => {
        console.log(e.target.files[0])
        chooseFile = e.target.files[0];
    })
    let recordBtn = $('#record');
    let stopBtn = $('#stop');
    stopBtn.attr("disabled", true);
    let submitBtn = $('.submit-btn');
    let outputScreen = $('.output')

    recordBtn.click(function () {
        if(soundFile){
            soundFile = new p5.SoundFile();
        }
        recorder.record(soundFile);
        getAudioContext().resume();
        recordBtn.attr("disabled", true);
        stopBtn.attr("disabled", false)
    })

    stopBtn.click(function () {
        recorder.stop();
        stopBtn.attr("disabled", true);
        submitBtn.show();
    })

    function writeUTFBytes(view, offset, string) {
        var lng = string.length;
        for (var i = 0; i < lng; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    function interleave(leftChannel, rightChannel) {
        var length = leftChannel.length + rightChannel.length;
        var result = new Float32Array(length);
        var inputIndex = 0;
        for (var index = 0; index < length;) {
            result[index++] = leftChannel[inputIndex];
            result[index++] = rightChannel[inputIndex];
            inputIndex++;
        }
        return result;
    }

    var Master = function () {
        const audiocontext = new window.AudioContext();
        this.input = audiocontext.createGain();
        this.output = audiocontext.createGain();
        //put a hard limiter on the output
        this.limiter = audiocontext.createDynamicsCompressor();
        this.limiter.threshold.value = -3;
        this.limiter.ratio.value = 20;
        this.limiter.knee.value = 1;
        this.audiocontext = audiocontext;
        this.output.disconnect();
        // connect input to limiter
        this.input.connect(this.limiter);
        // connect limiter to output
        this.limiter.connect(this.output);
        // meter is just for global Amplitude / FFT analysis
        this.meter = audiocontext.createGain();
        this.fftMeter = audiocontext.createGain();
        this.output.connect(this.meter);
        this.output.connect(this.fftMeter);
        // connect output to destination
        this.output.connect(this.audiocontext.destination);
        // an array of all sounds in the sketch
        this.soundArray = [];
        // an array of all musical parts in the sketch
        this.parts = [];
        // file extensions to search for
        this.extensions = [];
    };

   function getBlob() {
    var p5sound = new Master();
    var leftChannel, rightChannel;
    leftChannel = soundFile.buffer.getChannelData(0);
    // handle mono files
    if (soundFile.buffer.numberOfChannels > 1) {
        rightChannel = soundFile.buffer.getChannelData(1);
    } else {
        rightChannel = leftChannel;
    }
    var interleaved = interleave(leftChannel, rightChannel);
    // create the buffer and view to create the .WAV file
    var buffer = new window.ArrayBuffer(44 + interleaved.length * 2);
    var view = new window.DataView(buffer);
    // write the WAV container,
    // check spec at: https://web.archive.org/web/20171215131933/http://tiny.systems/software/soundProgrammer/WavFormatDocs.pdf
    // RIFF chunk descriptor
    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, 36 + interleaved.length * 2, true);
    writeUTFBytes(view, 8, 'WAVE');
    // FMT sub-chunk
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    // stereo (2 channels)
    view.setUint16(22, 2, true);
    view.setUint32(24, p5sound.audiocontext.sampleRate, true);
    view.setUint32(28, p5sound.audiocontext.sampleRate * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    // data sub-chunk
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, interleaved.length * 2, true);
    // write the PCM samples
    var lng = interleaved.length;
    var index = 44;
    var volume = 1;
    for (var i = 0; i < lng; i++) {
        view.setInt16(index, interleaved[i] * (32767 * volume), true);
        index += 2;
    }
    var myblob = new Blob([view], {
        type : 'application/octet-stream'
    })
       return myblob;
}



function fileHandler (){
    outputScreen.empty();
   $(".ui").addClass("active")
    $('.blur').addClass("modal")
    if(chooseFile){
        const data = new FormData();
        data.append('file', chooseFile)
        $.ajax({
            url : 'http://localhost:4000/upload',
            type: 'POST',
            data: data,
            cache : false,
            contentType: false,
            processData: false
        }).done(function(response) {
            console.log(response);
            chooseFile = null;
            outputScreen.append(response);
            $('.ui').removeClass("active")
            $('.blur').removeClass("modal")
        });
    }else{
        console.log(soundFile);
        blob = getBlob();
        const data = new FormData();
        data.append('file', blob, 'test' + Math.random().toFixed(2) * 100 + '.wav')
        $.ajax({
            url : 'http://localhost:4000/upload',
            type: 'POST',
            data: data,
            cache : false,
            contentType: false,
            processData: false
        }).done(function(response) {
            console.log(response);
            outputScreen.append(response);
            recordBtn.attr("disabled", false);
            stopBtn.attr("disabled", false);
            $('.ui').removeClass("active")
            $('.blur').removeClass("modal")
        });
    }
}


    submitBtn.click(fileHandler)

})
