import pickle
import pandas as pd
import numpy as np
import librosa
import sys

# row = open(r'C:\\Users\\abhishek\Desktop\\urban-sound-recog\backend\\uploads\\5.wav', 'r')
row = './uploads/' + sys.argv[1]
#print(row)


def parser(row):

    # handle exception to check if there isn't a file which is corrupted
    try:
        # here kaiser_fast is a technique used for faster extraction
        X, sample_rate = librosa.load(row, res_type='kaiser_fast')

        # we extract mfcc feature from data

        mfccs = np.mean(librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=40).T,axis=0)

    except Exception as e:
         print("Error encountered while parsing file: ", row)
         return None

    feature = mfccs

    return feature


cof = parser(row)
# print(cof)

cof = np.reshape(cof, (1,40))
# cof_list = []
# for i in range(40):
#     cof_list.append(cof[i])a

df_test = pd.DataFrame( columns = [i for i in range(40)], data = cof)

model = pickle.load(open(r'/Users/sahilaiact/Desktop/minor-project-college/minor-project/app/finalized_model2.sav', 'rb'))

# model = pickle.load('E:\\urban sound\\Urban_Sound_Recognition-minor-project-\\ML\\finalized_model.sav')
predictions = model.predict(df_test)
prediction = pd.DataFrame(predictions, columns=['prediction'])
print(prediction)

prediction = str(prediction.iloc[0,0])
# f = open(r"outputlabel.txt", "w")
# f.write(prediction)
# f.close()

