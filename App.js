import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  StatusBar,
  Image,
  TouchableOpacity,
} from 'react-native';
import * as tf from '@tensorflow/tfjs';
import {fetch, decodeJpeg} from '@tensorflow/tfjs-react-native';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as jpeg from 'jpeg-js';
import ImagePicker from 'react-native-image-picker';
// import RNFetchBlob from 'rn-fetch-blob';
// import ImgToBase64 from 'react-native-image-base64';
import {decode as atob, encode as btoa} from 'base-64';

const options = {
  title: 'Select Avatar',
  storageOptions: {
    skipBackup: true,
    path: 'images',
  },
};
class App extends React.Component {
  state = {
    isTfReady: false,
    isModelReady: false,
    predictions: null,
    image: null,
  };

  async componentDidMount() {
    await tf.ready();
    this.setState({
      isTfReady: true,
    });

    this.model = await mobilenet.load();
    this.setState({isModelReady: true});
  }
  onUpload = () => {
    ImagePicker.showImagePicker(options, async response => {
      if (!response.cancelled) {
        var source = {uri: response.uri};
        this.setState({image: source});
        // var binArray = [];
        // var datEncode = '';
        // for (i = 0; i < response.data.length; i++) {
        //   binArray[i] = await response.data[i].charCodeAt(0).toString(2);
        // }
        // console.log(binArray);
        // for (j = 0; j < binArray.length; j++) {
        //   var pad = padding_left(binArray[j], '0', 8);
        //   datEncode += pad + ' ';
        // }
        // function padding_left(s, c, n) {
        //   if (!s || !c || s.length >= n) {
        //     return s;
        //   }
        //   var max = (n - s.length) / c.length;
        //   for (var i = 0; i < max; i++) {
        //     s = c + s;
        //   }
        //   return s;
        // }
        // console.log(binArray);
        var byteCharacters = new ArrayBuffer(response.data.length);
        byteCharacters = response.data;
        // const imageTensor = this.imageToTensor(new ArrayBuffer(response.data));
        // const predictions = await this.model.classify(imageTensor);
        // console.log(predictions, 'lllll');
        // var imageData = new ArrayBuffer(byteCharacters);
        console.log(byteCharacters);
        var byteCharactersLength = byteCharacters.length;
        var array = new Uint8Array(new ArrayBuffer(byteCharactersLength));
        for (let i = 0; i < byteCharactersLength; i++) {
          array[i] = byteCharacters.charCodeAt(i);
        }
        console.log(array);
        Image.getSize(response.uri, async (width, height) => {
          const buffer = new Uint8Array(width * height * 3);
          let offset = 0; // offset into original data
          for (let i = 0; i < buffer.length; i += 3) {
            buffer[i] = array[offset];
            buffer[i + 1] = array[offset + 1];
            buffer[i + 2] = array[offset + 2];

            offset += 4;
          }
          var tfImage = tf.tensor3d(buffer, [height, width, 3]);

          const predictions = await this.model.classify(tfImage);
          console.log(predictions);
        });

        // const imageTensor = this.imageToTensor(imageData);
        // const predictions = await this.model.classify(imageTensor);
        // console.log(byteCharacters, 'lllll');
        // var byteNumbers = new Array(byteCharacters.length);
        // for (var i = 0; i < byteCharacters.length; i++) {
        //   byteNumbers[i] = byteCharacters.charCodeAt(i);
        //   byteArray = await new Uint8Array(byteNumbers);
        //   console.log('BYTEARRAY: ' + byteArray);
        // }
        this.onClick();
      }
    });
  };
  onClick = async () => {
    const image2 = require('./camera.jpg');
    const imageAssetPath = Image.resolveAssetSource(image2);
    try {
      const response = await fetch(imageAssetPath.uri, {}, {isBinary: true});
      const imageData = await response.arrayBuffer();
      // const imageTensor = decodeJpeg(imageData);
      // const rawImageData = await response.arrayBuffer()
      const imageTensor = this.imageToTensor(imageData);
      const predictions = await this.model.classify(imageTensor);
      // const prediction = (await model.predict(imageTensor))[0];
      this.setState({predictions});
      console.log(predictions);
    } catch (error) {
      console.error(error, 'err');
    }

    // console.log(prediction);
    // Use prediction in app.
    // setState({
    //   prediction,
    // });
  };
  imageToTensor(rawImageData) {
    const TO_UINT8ARRAY = true;
    const {width, height, data} = jpeg.decode(rawImageData, TO_UINT8ARRAY);
    // Drop the alpha channel info for mobilenet
    const buffer = new Uint8Array(width * height * 3);
    let offset = 0; // offset into original data
    for (let i = 0; i < buffer.length; i += 3) {
      buffer[i] = data[offset];
      buffer[i + 1] = data[offset + 1];
      buffer[i + 2] = data[offset + 2];

      offset += 4;
    }
    return tf.tensor3d(buffer, [height, width, 3]);
  }
  renderPrediction = prediction => {
    return (
      <Text key={prediction.className} style={styles.text}>
        {prediction.className}
      </Text>
    );
  };
  render() {
    const {isTfReady, isModelReady, predictions, image} = this.state;

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.commonTextStyles}>
            TFJS ready? {isTfReady ? <Text>✅</Text> : ''}
          </Text>

          <View style={styles.loadingModelContainer}>
            <Text style={styles.text}>Model ready? </Text>
            {isModelReady ? (
              <Text style={styles.text}>✅</Text>
            ) : (
              <ActivityIndicator size="small" />
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.imageWrapper}
          onPress={isModelReady ? this.onUpload : undefined}>
          {image && <Image source={image} style={styles.imageContainer} />}

          {isModelReady && !image && (
            <Text style={styles.transparentText}>Tap to choose image</Text>
          )}
        </TouchableOpacity>
        <View style={styles.predictionWrapper}>
          {isModelReady && image && (
            <Text style={styles.text}>
              Predictions: {predictions ? '' : 'Predicting...'}
            </Text>
          )}
          {isModelReady &&
            predictions &&
            predictions.map(p => this.renderPrediction(p))}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171f24',
    alignItems: 'center',
  },
  loadingContainer: {
    marginTop: 80,
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
  },
  loadingModelContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  imageWrapper: {
    width: 280,
    height: 280,
    padding: 10,
    borderColor: '#cf667f',
    borderWidth: 5,
    borderStyle: 'dashed',
    marginTop: 40,
    marginBottom: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: 250,
    height: 250,
    position: 'absolute',
    top: 10,
    left: 10,
    bottom: 10,
    right: 10,
  },
  predictionWrapper: {
    height: 100,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  transparentText: {
    color: '#ffffff',
    opacity: 0.7,
  },
  footer: {
    marginTop: 40,
  },
  poweredBy: {
    fontSize: 20,
    color: '#e69e34',
    marginBottom: 6,
  },
  tfLogo: {
    width: 125,
    height: 70,
  },
});
export default App;
