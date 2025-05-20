#!/usr/bin/env node

import fs from 'fs';

import { Device } from '@weejewel/samsung-mdc';
import express from 'express';
import getPort from 'get-port';
import getLocalIp from '@loxjs/node-local-ip';
import { v4 as uuidv4 } from 'uuid';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

yargs(hideBin(process.argv))
  .command({
    command: 'show-image',
    describe: 'Show an image on Samsung EMDX display',
    builder: yargs => yargs
      .option('image', {
        type: 'string',
        describe: 'Path to the image file',
        required: true,
      })
      .option('host', {
        required: true,
        type: 'string',
        describe: 'IP address',
      })
      .option('mac', {
        required: false,
        type: 'string',
        describe: 'MAC address',
      })
      .option('pin', {
        required: true,
        type: 'string',
        describe: 'e.g. 000000',
      })
      .option('local-ip', {
        required: false,
        type: 'string',
        describe: 'Local IP address to use for the server',
        default: getLocalIp(),
      }),
    handler: async (argv) => {
      const { image, host, mac, pin, localIp } = argv;

      const port = await getPort({
        port: 3000,
      });

      const fileId = uuidv4().toUpperCase();
      const fileSize = await fs.promises.stat(image).then(stats => stats.size);
      const fileExtension = image.split('.').pop();
      const fileName = `${fileId}.${fileExtension}`;

      console.log('🔄 Starting HTTP server...');
      await new Promise((resolve, reject) => {
        const app = express()
          .get('/content.json', (req, res) => {
            console.log('🔄 Serving /content.json...');

            res.header('Content-Type', 'application/json');
            res.send(JSON.stringify({
              schedule: [
                {
                  start_date: '1970-01-01',
                  stop_date: '2999-12-31',
                  start_time: '00:00:00',
                  contents: [
                    {
                      image_url: `http://${localIp}:${port}/image`,
                      file_id: fileId,
                      file_path: `/home/owner/content/Downloads/vxtplayer/epaper/mobile/contents/${fileId}/${fileName}`,
                      duration: 91326, // TODO ?
                      file_size: `${fileSize}`,
                      file_name: `${fileName}`,
                    },
                  ],
                },
              ],
              name: 'node-samsung-emdx',
              version: 1,
              create_time: '2025-01-01 00:00:00',
              id: fileId,
              program_id: 'com.samsung.ios.ePaper',
              content_type: 'ImageContent',
              deploy_type: 'MOBILE'
            }).replaceAll('/', '\\/'));

            req.once('close', () => {
              console.log('✅ Served /content.json');
              console.log('');
            });
          })
          .get(`/image`, (req, res) => {
            console.log(`🔄 Serving /image...`);
            res.sendFile(image);

            req.once('close', () => {
              console.log(`✅ Served /image`);
              console.log('');

              process.exit(0);
            });
          })
          .listen(port, err => {
            if (err) return reject(err);
            return resolve();
          });
      });
      console.log(`✅ HTTP server listening at http://${localIp}:${port}`);
      console.log('');

      const device = new Device({
        host,
        mac,
        pin,
      });

      if (mac) {
        console.log('🔄 Waking up device...');
        await device.wakeup();
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Device woken up');
        console.log('');
      }

      console.log('🔄 Connecting...');
      await device.connect();
      console.log('✅ Connected');
      console.log('');

      const url = `http://${localIp}:${port}/content.json`;
      console.log(`🔄 Setting content to ${url}...`);
      await device.setContentDownload({ url });
      await device.disconnect();
      console.log('✅ Content set');
      console.log('');
    },
  })
  .demandCommand()
  .parse();