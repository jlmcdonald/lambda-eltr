let AWS = require('aws-sdk'),
    md5 = require('md5');

AWS.config.loadFromPath(`${__dirname}/../config/creds.json`);

let eltr = new AWS.ElasticTranscoder({
        apiVersion: '2012–09–25',
        region: 'us-west-2'
    }),
    pipeline = process.env.PIPELINE || '1485452966929-fx7qsr',
    inputBucket = process.env.BUCKET || 'flynns.vidangel.com',
    suffix = process.env.SUFFIX || '';

exports.setSuffix = val => {
    suffix = val;
};

exports.handler = (event, context) => {
    let recordBucket = event.Records[0].s3.bucket.name,
        key = event.Records[0].s3.object.key,
        srcKey = decodeURIComponent(key.replace(/\+/g, " ")),
        newKey = key.substr(0, key.lastIndexOf('.')) || key,
        pipelineId = pipeline,
        presetIds = [
            '1467231588813-5d8ms3',
            '1467231357342-5gwjt3',
            '1467236040293-fnbgot',
            '1467236076292-aemnyl'
        ],
        outputs = presetIds.map(preset => {
            let transcodePrefix = `${newKey}-${preset}${suffix}`,
                hashKey = md5(transcodePrefix).match(new RegExp('.{1,8}', 'g')).join("-");

            return {
                Key: hashKey,
                ThumbnailPattern: `${transcodePrefix}-{count}`,
                SegmentDuration: '6',
                PresetId: preset
            };
        }),
        playlistKeys = presetIds.map(preset => {
            let transcodePrefix = `${newKey}-${preset}${suffix}`,
                hashKey = md5(transcodePrefix).match(new RegExp('.{1,8}', 'g')).join("-");

            return hashKey;
        }),
        params = {
            PipelineId: pipelineId,
            Input: {
                Key: srcKey,
                FrameRate: 'auto',
                Resolution: 'auto',
                AspectRatio: 'auto',
                Interlaced: 'auto',
                Container: 'auto'
            },
            Outputs: outputs,
            Playlists: [{
                Name: `${newKey}${suffix}`,
                OutputKeys: playlistKeys,
                Format: 'HLSv3'
            }]
        };

    if (recordBucket !== inputBucket) {
        context.fail({
            "created": false,
            "msg": "Incorrect Video Input Bucket",
            "event": event
        });
        return;
    }
    eltr.createJob(params, (err, data) => {
        if (err) {
            context.fail({
                "created": false,
                "msg": err,
                "event": event
            });
        }
        else {
            context.succeed({
                "created": true,
                "msg": data
            });
        }
    });
};
