
const manual = location.href.indexOf('SnapManual') >= 0;

const create_paragraphs = () => manual ? create_manual_paragraphs() : create_guide_paragraphs();

let paragraph_to_page_number = [];

let paragraphs = [];

const paragraph_elements = (page) => {
    const index_of_equals = location.search.indexOf('=');
    if (+location.search.substring(index_of_equals+1) === page) {
        paragraphs = paragraphs.concat(Array.from(document.getElementsByClassName('text-container')));
        paragraph_to_page_number.push(paragraphs.length);
        if (page < 6) {// 147) {
            page++;
            IDRViewer.goToPage(page);
            paragraph_elements(page);
        } else {
            console.log(JSON.stringify(create_sentences(create_manual_paragraphs(paragraphs))));
        }
    } else {
        setTimeout(paragraph_elements, 1000);
    }   
};

if (manual) {
    IDRViewer.goToPage(4);
    paragraph_elements(4); // skip the table of contents
}

const create_manual_paragraphs = (paragraphs) => { 
    console.log(paragraphs);
    // ignore repeated periods (thanks Codex) - but maybe no longer needed since was triggered when table of contents was included
    // .replaceAll(/\.{2,}/g, ' ')
    // and middle initials --- Codex suggested a-z
    return paragraphs.map(x => x.innerText.replaceAll('\n','').replaceAll(/[A-Z]\./g, ''))
            .filter(paragraph => paragraph.length > 100); 
};

const create_guide_paragraphs = () => {
    let paragraphs = Array.from(document.getElementsByTagName('p'))
                    .filter(paragraph => paragraph.className !== 'guide-to-guide').map(x => x.innerText);
    const ordered_lists = Array.from(document.getElementsByTagName('ol')).map(list => list.innerText);
    const unordered_lists = Array.from(document.getElementsByTagName('ul')).map(list => list.innerText);
    return paragraphs.concat(ordered_lists).concat(unordered_lists).filter(paragraph => paragraph.length > 100);
};

const create_sentences = (paragraphs) => {
    const remove_final_punctuation = sentence =>
        '.?'.indexOf(sentence[sentence.length-1]) >= 0 ? sentence.slice(0, sentence.length-1) : sentence;
    const remove_parenthetical_remarks = text => text.replaceAll(/ \([^)]*\)/g, ''); // thank you Codex
    const sentences_in_a_paragraph = paragraphs.map(paragraph => 
                                        remove_parenthetical_remarks(paragraph).split(/\n|[.?] /) // new line or end of sentence (including ! causes problems due to Snap!)
                                        .filter(sentence => (sentence.trim()[0] !== '(')) // remove short or parenthetical sentences
                                        .map(sentence => remove_final_punctuation(sentence.trim())));
    const join_fragments = (fragments) => {
        let new_sentences = [];
        for (let i = 0; i < fragments.length; i++) {
           const fragment = fragments[i].trim();
            const suffix = i === fragments.length-1 ? '' : '. '; // don't add period to last sentence
            if (i < fragments.length-1 && 
                (fragment.lastIndexOf('e.g') === fragment.length-'e.g'.length ||
                 fragment.lastIndexOf('..') === fragment.length-'..'.length)) {
                const full_sentence = fragment + suffix + fragments[i+1].trim(); // shouldn't been broken by split
                if (full_sentence.length > 25) {
                    new_sentences.push(full_sentence); 
                }
                i++; // skip next one since combined with this one
            } else if (fragment.length > 24) {
                new_sentences.push(fragment);
            }
        }
        return new_sentences;
    };
    const headers = Array.from(document.getElementsByTagName('h4'))
                   .filter(header => header.className !== 'guide-to-guide-white').map(x => [x.innerText.trim()])
                   .filter(text => text[0].split(' ').length > 1); // remove single word headers
    return sentences_in_a_paragraph.map(join_fragments).concat(headers);
};

// window.addEventListener('DOMContentLoaded',
//                         () => {
//                             console.log(JSON.stringify(create_sentences(create_paragraphs())));
//                         });

// window.create_use_model = (continuation) => {
//     use.load().then(model => {
//         window.use_model = model;
//         continuation();
//     });
// };

// window.create_embeddings = () => {
//     create_paragraphs();
//     create_sentences();
//     window.embeddings = [];
//     const embed_a_paragraph = (index) => {
//         if (index < sentences.length) {
//             use_model.embed(sentences[index]).then(embeddings_tensor => {
//                 embeddings.push(embeddings_tensor.arraySync());
//                 embeddings_tensor.dispose();
//                 console.log(embeddings);
//                 embed_a_paragraph(index+1);
//             })
//         }
//     }
//     embed_a_paragraph(0);   
// };

// window.create_classifier = () => {
//     window.classifier = knnClassifier.create();
//     embeddings.forEach((paragraph_of_sentences, paragraph_number) => {
//         paragraph_of_sentences.forEach(sentence => {
//             classifier.addExample(tf.tensor(sentence), paragraph_number);
//         });
//     });
// };

// window.test = () => {
//     const questions = 
//         ['What are word embeddings?',
//          'How are embeddings made?',
//          'How can I create a sentence embedding?',
//          'What is the sentence features block?'];
//     const k = 5;
//     window.classifications = [];
//     const classify = (index) => {
//         if (index < questions.length) {
//             use_model.embed(questions[index]).then(question_tensor => {
//                 classifier.predictClass(question_tensor, k).then(classification => {
//                     const results = [questions[index]];
//                     let confidences = Object.entries(classification.confidences).filter(([index, confidence]) => confidence > 0);
//                     confidences.sort((a, b) => b[1] - a[1]);
//                     confidences.forEach(([index, confidence]) => {
//                                           results.push(paragraphs[index]);
//                                           results.push(confidence);
//                     });
//                     classifications.push(results);
//                     question_tensor.dispose();
//                     classify(index+1);
//                 });
//             });
//         } else {
//             console.log(classifications);
//         }
//     };
//     classify(0);
// };

// create_classifier();
// create_use_model(test);
